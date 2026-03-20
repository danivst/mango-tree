// @ts-nocheck

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as notificationController from '../src/controllers/notification-controller';
import Notification from '../src/models/notification';
import NotificationType from '../src/enums/notification-type';

// Mock the Notification model
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

// Helper to create a mock query that handles chaining (for find)
function createMockQuery(result: any): any {
  const query: any = {
    then(onfulfilled: any, onrejected?: any) {
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

describe('Notification Controller', () => {

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
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          type: NotificationType.LIKE,
          message: 'User liked your post',
          translations: {
            message: { en: 'User liked your post', bg: 'Потребител хареса вашия пост' }
          },
          read: true,
          createdAt: new Date(),
        },
      ];

      mockFind.mockReturnValue(createMockQuery(notifications));

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.getNotifications(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it('should return empty array when user has no notifications', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockFind.mockReturnValue(createMockQuery([]));

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.getNotifications(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('PUT /notifications/:id/read - markAsRead', () => {

    it('should mark a single notification as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = {
        _id: notificationId,
        userId,
        type: NotificationType.FOLLOW,
        message: 'Test message',
        translations: {
          message: { en: 'Test message', bg: 'Тестово съобщение' }
        },
        read: false,
        createdAt: new Date(),
      };

      mockFindOneAndUpdate.mockReturnValue(notification as any);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.markAsRead(req, res);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: notificationId.toString(), userId: userId.toString() },
        { read: true },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification marked as read',
        notification,
      });
    });

    it('should return 404 when notification does not exist or does not belong to user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      mockFindOneAndUpdate.mockReturnValue(null);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found.' });
    });
  });

  describe('PUT /notifications/read-all - markAllAsRead', () => {

    it('should mark all notifications as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockUpdateMany.mockResolvedValue({ modifiedCount: 5 });

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.markAllAsRead(req, res);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userId: userId.toString(), read: false },
        { read: true }
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });

    it('should succeed even if no notifications to update', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockUpdateMany.mockResolvedValue({ modifiedCount: 0 });

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.markAllAsRead(req, res);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userId: userId.toString(), read: false },
        { read: true }
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });
  });

  describe('DELETE /notifications/:id - deleteNotification', () => {

    it('should delete a single notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = {
        _id: notificationId,
        userId,
        type: NotificationType.FOLLOW,
        message: 'Test message',
        read: false,
        createdAt: new Date(),
      };

      mockFindOneAndDelete.mockReturnValue(notification as any);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.deleteNotification(req, res);

      expect(mockFindOneAndDelete).toHaveBeenCalledWith({ _id: notificationId.toString(), userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification deleted',
        notification,
      });
    });

    it('should return 404 when notification does not exist or does not belong to user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      mockFindOneAndDelete.mockReturnValue(null);

      const req = {
        user: { userId: userId.toString() },
        params: { id: notificationId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found.' });
    });
  });

  describe('DELETE /notifications - deleteAllNotifications', () => {

    it('should delete all notifications for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockDeleteMany.mockResolvedValue({ deletedCount: 10 });

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.deleteAllNotifications(req, res);

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications deleted' });
    });

    it('should succeed even if no notifications to delete', async () => {
      const userId = new mongoose.Types.ObjectId();
      mockDeleteMany.mockResolvedValue({ deletedCount: 0 });

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await notificationController.deleteAllNotifications(req, res);

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications deleted' });
    });
  });
});
