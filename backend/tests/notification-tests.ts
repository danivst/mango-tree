/**
 * @file notification-tests.ts
 * @description Unit tests for notification controller.
 * Tests CRUD operations: get, mark read, mark all read, delete, delete all.
 * Uses Jest with mocked Mongoose models and utilities.
 *
 * Run with: `npm test` or `jest`
 */

// @ts-nocheck

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as notificationController from '../src/controllers/notification-controller';
import Notification from '../src/models/notification';
import NotificationType from '../src/enums/notification-type';

// mock configuration
const mockFind = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockDeleteMany = jest.fn();

Notification.find = mockFind;
Notification.findOneAndUpdate = mockFindOneAndUpdate;
Notification.updateMany = mockUpdateMany;
Notification.findOneAndDelete = mockFindOneAndDelete;
Notification.deleteMany = mockDeleteMany;

// mock query helper
function createMockQuery(result) {
  const query = {
    then(onfulfilled, onrejected) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
    exec: jest.fn().mockReturnValue(Promise.resolve(result)),
  };
  query.sort = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// notification tests
describe('Notification Controller', () => {

  // get notifications
  describe('GET /notifications - getNotifications', () => {
    it('should return all notifications for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          type: NotificationType.FOLLOW,
          message: 'User started following you',
          translations: {
            message: { en: 'User started following you', bg: 'Потребител започна да ви следва' }
          },
          read: false,
          createdAt: new Date(),
        }
      ];

      mockFind.mockReturnValue(createMockQuery(notifications));

      const req = { user: { userId: userId.toString() } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await notificationController.getNotifications(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it('should return empty array when user has no notifications', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockFind.mockReturnValue(createMockQuery([]));

      const req = { user: { userId: userId.toString() } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await notificationController.getNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // mark as read
  describe('PUT /notifications/:id/read - markAsRead', () => {
    it('should mark a single notification as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = { _id: notificationId, read: true };

      mockFindOneAndUpdate.mockReturnValue(notification);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await notificationController.markAsRead(req, res);

      expect(mockFindOneAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification marked as read',
        notification,
      });
    });

    it('should return 404 when notification does not exist', async () => {
      mockFindOneAndUpdate.mockReturnValue(null);

      const req = { user: { userId: '123' }, params: { id: '456' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found.' });
    });
  });

  // mark all as read
  describe('PUT /notifications/read-all - markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockUpdateMany.mockResolvedValue({ modifiedCount: 5 });

      const req = { user: { userId: userId.toString() } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.markAllAsRead(req, res);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userId: userId.toString(), read: false },
        { read: true }
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });
  });

  // delete notification
  describe('DELETE /notifications/:id - deleteNotification', () => {
    it('should delete a single notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = { _id: notificationId };

      mockFindOneAndDelete.mockReturnValue(notification);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.deleteNotification(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted', notification });
    });
  });

  // delete all notifications
  describe('DELETE /notifications - deleteAllNotifications', () => {
    it('should delete all notifications for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockDeleteMany.mockResolvedValue({ deletedCount: 10 });

      const req = { user: { userId: userId.toString() } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.deleteAllNotifications(req, res);

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications deleted' });
    });
  });
});