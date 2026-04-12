/**
 * @file post-interaction-controller.ts
 * @description Handles user interactions with posts, including the like/unlike system 
 * and on-demand translation services for post content, titles, and tags.
 */

import { Response } from "express";
import { Types } from "mongoose";
import Post from "../../models/post-model";
import User from "../../models/user-model";
import Notification from "../../models/notification-model";
import NotificationType from "../../enums/notification-type";
import { AuthRequest } from "../../interfaces/auth";
import { getDualTranslation } from "../../utils/translation";
import logger from "../../utils/logger";

/**
 * Toggles like on a post.
 * Adds or removes the user ID from the post's likes array. Sends a 
 * notification to the author if it's a new like.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Express response object
 * @returns Response with message and total like count
 * @throws {Error} Database error or 404 if post not found
 *
 * @example
 * ```typescript
 * POST /api/posts/post_id_123/like
 * ```
 * @response
 * ```json
 * { "message": "Liked", "totalLikes": 10 }
 * ```
 */
export const toggleLikePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userIdObj = new Types.ObjectId(userId);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const hasLiked = post.likes.some((likeId: Types.ObjectId) =>
      likeId.equals(userIdObj),
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (likeId: Types.ObjectId) => !likeId.equals(userIdObj),
      );
    } else {
      post.likes.push(userIdObj);
    }

    await post.save();

    if (!hasLiked && post.authorId.toString() !== userId) {
      const postTitleEn = post.translations?.title?.en || post.title;
      const postTitleBg = post.translations?.title?.bg || post.title;

      // Fallback: if JWT lacks username, fetch from DB
      let actorUsername = req.user?.username;
      if (!actorUsername) {
        const actor = await User.findById(userId).select("username");
        actorUsername = actor?.username || "Someone";
      }

      const messageEn = `${actorUsername} liked your post "${postTitleEn}"`;
      const messageBg = `${actorUsername} хареса вашата публикация "${postTitleBg}"`;

      await Notification.create({
        userId: post.authorId,
        type: NotificationType.LIKE,
        message: messageEn,
        translations: {
          message: {
            en: messageEn,
            bg: messageBg,
          },
        },
        link: `/posts/${post._id}`,
      });
    }

    return res.json({
      message: hasLiked ? "Unliked" : "Liked",
      totalLikes: post.likes.length,
    });
  } catch (err: any) {
    logger.error(err, "Toggle Like Post Error");
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Translates a post on demand.
 * Fetches dual translations for title, content, and tags based on the requested language.
 *
 * @param req - AuthRequest with params { id } and query { targetLang }
 * @param res - Express response object
 * @returns Response with translated post fields
 * @throws {Error} 400 for invalid language or translation service failure
 *
 * @example
 * ```typescript
 * GET /api/posts/post_id_123/translate?targetLang=bg
 * ```
 * @response
 * ```json
 * { "title": "...", "content": "...", "tags": [...], "targetLang": "bg" }
 * ```
 */
export const translatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { targetLang } = req.query;

    // Validate target language
    if (!targetLang || !["en", "bg"].includes(targetLang as string)) {
      return res
        .status(400)
        .json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    const post = await Post.findById(id)
      .populate("authorId", "username profileImage")
      .populate("category", "name");
    if (!post || !post.isVisible) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Determine source text (original content)
    const titleToTranslate = post.title;
    const contentToTranslate = post.content;

    // Get translations for both languages
    const [titleTrans, contentTrans] = await Promise.all([
      getDualTranslation(titleToTranslate),
      getDualTranslation(contentToTranslate),
    ]);

    // Translate tags
    let translatedTags: string[] = [];
    if (post.tags && post.tags.length > 0) {
      const tagsTranslations = await Promise.all(
        post.tags.map((tag) => getDualTranslation(tag)),
      );
      const isBg = targetLang === "bg";
      translatedTags = tagsTranslations.map((t) => (isBg ? t.bg : t.en));
    }

    // Return the requested language
    const isBg = targetLang === "bg";
    const translatedTitle = isBg ? titleTrans.bg : titleTrans.en;
    const translatedContent = isBg ? contentTrans.bg : contentTrans.en;

    return res.json({
      title: translatedTitle,
      content: translatedContent,
      tags: translatedTags,
      sourceLang: isBg ? "en" : "bg",
      targetLang: targetLang,
    });
  } catch (err: any) {
    logger.error(err, "Translation error");
    return res.status(500).json({ message: err.message });
  }
};