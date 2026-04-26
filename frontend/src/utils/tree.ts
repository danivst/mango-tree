/**
 * @file tree.ts
 * @description Tree data structure utilities.
 * Provides functions for working with nested/recursive data structures,
 * particularly useful for threaded comments and hierarchical content.
 *
 * All tree utilities work with any data type that has an `_id` field
 * and an optional `replies` (or similar) array of children.
 */

import type { Comment } from './types';

/**
 * Generic tree item interface for utils
 * @template T - Type that extends { _id: string; replies?: T[] }
 */
export interface TreeNode<T extends { _id: string; replies?: T[] }> {
  _id: string;
  replies?: T[];
}

/**
 * Update an item within a tree structure.
 * Recursively searches through nested children to find and update the target item.
 *
 * Common use case: Updating a comment in a threaded comment tree
 * when a like, deletion, or edit occurs on a deep reply.
 *
 * @function updateInTree
 * @template T - Tree node type (e.g., Comment, Post with children)
 * @param {T[]} items - The tree array to search
 * @param {string} itemId - ID of the item to update
 * @param {(item: T) => T} updater - Function that takes current item and returns updated version
 * @returns {T[]} New tree array with updated item (immutably preserved)
 *
 * @example
 * ```typescript
 * // Update a comment's likes count
 * const updatedComments = updateInTree(comments, commentId, (c) => ({
 *   ...c,
 *   likes: [...c.likes, currentUserId]
 * }));
 * ```
 */
export function updateInTree<T extends TreeNode<T>>(
  items: T[],
  itemId: string,
  updater: (item: T) => T
): T[] {
  return items.map(item => {
    if (item._id === itemId) {
      return updater(item);
    }

    if (item.replies && item.replies.length > 0) {
      return {
        ...item,
        replies: updateInTree(item.replies, itemId, updater)
      };
    }

    return item;
  });
}

/**
 * Find an item in a tree structure by ID.
 * Returns the item and its parent (if found).
 *
 * @function findInTree
 * @template T - Tree node type
 * @param {T[]} items - The tree array to search
 * @param {string} itemId - ID of the item to find
 * @returns {{ item: T | null; parent: T | null }} Found item and its parent (or null)
 */
export function findInTree<T extends TreeNode<T>>(
  items: T[],
  itemId: string
): { item: T | null; parent: T | null } {
  for (const item of items) {
    if (item._id === itemId) {
      return { item, parent: null };
    }

    if (item.replies && item.replies.length > 0) {
      const { item: found, parent } = findInTree(item.replies, itemId);
      if (found) {
        return { item: found, parent: parent || item };
      }
    }
  }

  return { item: null, parent: null };
}

/**
 * Count all items in a tree (including root items and all descendants).
 *
 * @function countAllInTree
 * @template T - Tree node type
 * @param {T[]} items - The tree array to count
 * @returns {number} Total count of all nodes
 *
 * @example
 * ```typescript
 * const totalComments = countAllInTree(comments);
 * ```
 */
export function countAllInTree<T extends TreeNode<T>>(items: T[]): number {
  return items.reduce((total, item) => {
    const selfCount = 1;
    const childCount = item.replies ? countAllInTree(item.replies) : 0;
    return total + selfCount + childCount;
  }, 0);
}

/**
 * Map over all items in a tree (depth-first traversal).
 * Returns a new tree with all items transformed by the mapper function.
 *
 * @function mapTree
 * @template T - Tree node type
 * @template R - Result type (can be different from T)
 * @param {T[]} items - The tree array to map
 * @param {(item: T, depth: number) => R} mapper - Transformation function
 * @param {number} [depth=0] - Current depth (used internally for recursion)
 * @returns {R[]} New array with transformed items
 */
export function mapTree<T extends TreeNode<T>, R>(
  items: T[],
  mapper: (item: T, depth: number) => R,
  depth: number = 0
): R[] {
  return items.map(item => ({
    ...mapper(item, depth),
    ...(item.replies && item.replies.length > 0
      ? { replies: mapTree(item.replies, mapper, depth + 1) }
      : {})
  }));
}

/**
 * Filter items in a tree based on a predicate.
 * Returns a new tree with items that pass the filter.
 * Note: if a parent is filtered out, its children are also removed.
 *
 * @function filterTree
 * @template T - Tree node type
 * @param {T[]} items - The tree array to filter
 * @param {(item: T) => boolean} predicate - Filter function
 * @returns {T[]} New tree with filtered items
 */
export function filterTree<T extends TreeNode<T>>(
  items: T[],
  predicate: (item: T) => boolean
): T[] {
  return items.filter(item => {
    if (predicate(item)) {
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: filterTree(item.replies, predicate)
        };
      }
      return item;
    }

    if (item.replies && item.replies.length > 0) {
      const filteredChildren = filterTree(item.replies, predicate);
      if (filteredChildren.length > 0) {
        return {
          ...item,
          replies: filteredChildren
        };
      }
    }

    return false;
  });
}

/**
 * Remove an item from a tree by ID.
 * Useful for deleting comments or nested content.
 *
 * @function removeFromTree
 * @template T - Tree node type
 * @param {T[]} items - The tree array
 * @param {string} itemId - ID of the item to remove
 * @returns {T[]} New tree array without the removed item
 */
export function removeFromTree<T extends TreeNode<T>>(
  items: T[],
  itemId: string
): T[] {
  return items.reduce<T[]>((acc, item) => {
    if (item._id === itemId) {
      return acc;
    }

    if (item.replies && item.replies.length > 0) {
      return [
        ...acc,
        {
          ...item,
          replies: removeFromTree(item.replies, itemId)
        }
      ];
    }

    return [...acc, item];
  }, []);
}

export const commentUtils = {
  /**
   * Update a comment in the comment tree (convenience wrapper)
   */
  update: (comments: Comment[], commentId: string, updater: (c: Comment) => Comment) =>
    updateInTree(comments, commentId, updater),

  /**
   * Count all comments including nested replies
   */
  countAll: (comments: Comment[]) => countAllInTree(comments),

  /**
   * Remove a comment from the tree
   */
  remove: (comments: Comment[], commentId: string) =>
    removeFromTree(comments, commentId)
};
