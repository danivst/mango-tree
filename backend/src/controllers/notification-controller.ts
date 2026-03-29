import { Response } from 'express';
import Notification from '../models/notification';
import { AuthRequest } from '../interfaces/auth';

/**
 * Retrieves all notifications for the authenticated user, sorted by creation date (newest first).
 *
 * @param req - AuthRequest
 * @param res - Response with array of Notification documents
 * @returns 200 with notifications array
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json(notifications);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Marks a specific notification as read.
 *
 * @param req - AuthRequest with params { id } (notification ID)
 * @param res - Response with success message or 404
 * @returns 200 on success, 404 if notification not found
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({ message: 'Notification marked as read', notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Marks all notifications for the authenticated user as read.
 *
 * @param req - AuthRequest
 * @param res - Response with success message
 * @returns 200 with count of updated notifications
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.updateMany({ userId, read: false }, { read: true });

    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes a single notification.
 *
 * @param req - AuthRequest with params { id }
 * @param res - Response with success message or 404
 * @returns 200 on success, 404 if not found
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.json({ message: 'Notification deleted', notification });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes all notifications for the authenticated user.
 *
 * @param req - AuthRequest
 * @param res - Response with success message
 * @returns 200 with count of deleted notifications
 */
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    await Notification.deleteMany({ userId });

    return res.json({ message: 'All notifications deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};