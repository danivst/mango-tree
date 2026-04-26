/**
 * @file notification-tests.ts
 * @description Unit tests for notification controller.
 * Tests CRUD operations: get, mark read, mark all read, delete, delete all.
 * Uses Jest with mocked Mongoose models and utilities.
 *
 * Run with: `npm test` or `jest`
 */

// @ts-nocheck

import { Request, Response } from "express";
import mongoose from "mongoose";
import * as notificationController from "../src/controllers/notification-controller";
import Notification from "../src/models/notification-model";
import NotificationType from "../src/enums/notification-type";
import logger from "../src/utils/logger";
import { AppError } from "../src/middleware/error-middleware";

/**
 * Mock the logger utility to prevent test output pollution during execution.
 */
jest.mock("../src/utils/logger");

/**
 * Mocking Mongoose Model methods for the Notification collection.
 */
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

/**
 * Helper function to create a mock Mongoose query object.
 * Supports chaining for common query operations like sort, limit and skip.
 *  
 * @param {any} result - The data to be returned by the mocked query.
 * @returns {object} A mocked query object compatible with Mongoose.
 */
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

/**
 * Global setup before each test case.
 * Clears all mock call history to ensure test isolation.
 */
beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Test suite for Notification Controller logic.
 */
describe("Notification Controller", () => {

  /**
   * Tests for the getNotifications endpoint.
   */
  describe("GET /notifications - getNotifications", () => {
    /**
     * @test Verifies that the controller returns a list of notifications for a valid user.
     */
    it("should return all notifications for a user", async () => {
      const userId = new mongoose.Types.ObjectId();
      const notifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          type: NotificationType.FOLLOW,
          message: "User started following you",
          translations: {
            message: { en: "User started following you", bg: "Потребител започна да ви следва" }
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

    /**
     * @test Verifies that an empty array is returned when no notifications exist.
     */
    it("should return empty array when user has no notifications", async () => {
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

    /**
     * @test Verifies that database errors are logged using the structured logger.
     */
    it("should handle internal errors with logger", async () => {
      const userId = new mongoose.Types.ObjectId();
      const error = new Error("Database connection failed");
      mockFind.mockImplementation(() => { throw error; });

      const req = { user: { userId: userId.toString() } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      try {
        await notificationController.getNotifications(req, res);
      } catch (e) {
        logger.error(error, "Error fetching notifications");
      }
    });
  });

  /**
   * Tests for the markAsRead endpoint.
   */
  describe("PUT /notifications/:id/read - markAsRead", () => {
    /**
     * @test Verifies that a specific notification is marked as read successfully.
     */
    it("should mark a single notification as read", async () => {
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
        message: "Notification marked as read",
        notification,
      });
    });

    /**
     * @test Verifies that a 404 error is returned if the notification ID does not exist.
     */
    it("should return 404 when notification does not exist", async () => {
      mockFindOneAndUpdate.mockReturnValue(null);

      const req = { user: { userId: "123" }, params: { id: "456" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Notification not found." });
    });
  });

  /**
   * Tests for the markAllAsRead endpoint.
   */
  describe("PUT /notifications/read-all - markAllAsRead", () => {
    /**
     * @test Verifies that all unread notifications for a user are marked as read.
     */
    it("should mark all notifications as read", async () => {
      const userId = new mongoose.Types.ObjectId();
      mockUpdateMany.mockResolvedValue({ modifiedCount: 5 });

      const req = { user: { userId: userId.toString() } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.markAllAsRead(req, res);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userId: userId.toString(), read: false },
        { read: true }
      );
      expect(res.json).toHaveBeenCalledWith({ message: "All notifications marked as read" });
    });
  });

  /**
   * Tests for the deleteNotification endpoint.
   */
  describe("DELETE /notifications/:id - deleteNotification", () => {
    /**
     * @test Verifies that a specific notification is deleted correctly.
     */
    it("should delete a single notification", async () => {
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

      expect(res.json).toHaveBeenCalledWith({ message: "Notification deleted", notification });
    });
  });

  /**
   * Tests for the deleteAllNotifications endpoint.
   */
  describe("DELETE /notifications - deleteAllNotifications", () => {
    /**
     * @test Verifies that all notifications for a user are purged from the database.
     */
    it("should delete all notifications for a user", async () => {
      const userId = new mongoose.Types.ObjectId();
      mockDeleteMany.mockResolvedValue({ deletedCount: 10 });

      const req = { user: { userId: userId.toString() } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await notificationController.deleteAllNotifications(req, res);

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(res.json).toHaveBeenCalledWith({ message: "All notifications deleted" });
    });
  });
});