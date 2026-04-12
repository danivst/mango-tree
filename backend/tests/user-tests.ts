/**
 * @file user-tests.ts
 * @description Unit tests for user controller.
 * Tests profile management, follow/unfollow, and account deletion.
 * Uses Jest with mocked Mongoose models and utilities.
 *
 * Run with: `npm test` or `jest`
 */

// @ts-nocheck

import { Request, Response } from "express";
import mongoose from "mongoose";
import * as userController from "../src/controllers/user/user-controller";
import RoleTypeValue from "../src/enums/role-type";
import NotificationType from "../src/enums/notification-type";
import logger from "../src/utils/logger";

/**
 * Mock the logger utility to prevent test output pollution.
 */
jest.mock("../src/utils/logger");

/**
 * Mocking external utility modules.
 */
jest.mock("../src/utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/utils/translation", () => ({
  getDualTranslation: jest.fn().mockResolvedValue({ en: "translated", bg: "преведено" }),
}));

/**
 * Mocking the activity logger to prevent it from failing due to missing request properties.
 */
jest.mock("../src/utils/activity-logger", () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

/**
 * Mocking Mongoose models. 
 * Using __esModule: true and default property to satisfy dynamic (await import) 
 * and standard imports used in the controller.
 */
jest.mock("../src/models/notification-model", () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

jest.mock("../src/models/post-model", () => ({
  __esModule: true,
  default: {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    find: jest.fn().mockReturnValue({
      distinct: jest.fn().mockResolvedValue([]) 
    }),
  },
}));

jest.mock("../src/models/comment-model", () => ({
  __esModule: true,
  default: {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    find: jest.fn().mockReturnValue({
      distinct: jest.fn().mockResolvedValue([])
    }),
  },
}));

jest.mock("../src/models/report-model", () => ({
  __esModule: true,
  default: {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

jest.mock("../src/models/banned-user-model", () => ({
  __esModule: true,
  default: {
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

import User from "../src/models/user-model";
import Notification from "../src/models/notification-model";
import Post from "../src/models/post-model";
import Comment from "../src/models/comment-model";

/**
 * Helper to create a mock Mongoose query object.
 * Supports chaining for common query operations.
 * 
 * @param {any} result - The data to be returned by the mocked query.
 * @returns {object} A mocked query object.
 */
function createMockQuery(result) {
  const query = {
    then(onfulfilled, onrejected) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
    exec: jest.fn().mockReturnValue(Promise.resolve(result)),
  };
  query.select = jest.fn().mockReturnValue(query);
  query.sort = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  return query;
}

/**
 * Helper function to create a standardized mock User document.
 * 
 * @param {object} overrides - Object containing fields to override in the base mock.
 * @returns {object} A mock user document.
 */
const createMockUserDoc = (overrides = {}) => {
  const userId = overrides._id || new mongoose.Types.ObjectId();
  return {
    _id: userId,
    username: "testuser",
    email: "test@example.com",
    role: RoleTypeValue.USER,
    following: [],
    followers: [],
    pastUsernames: [],
    language: "en",
    isBanned: false,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
};

/**
 * Static mock assignments for User model methods.
 */
User.findById = jest.fn();
User.findOne = jest.fn();
User.exists = jest.fn();
User.find = jest.fn();
User.findByIdAndUpdate = jest.fn();
User.findByIdAndDelete = jest.fn();

/**
 * Global setup before each test case.
 */
beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Main test suite for User Controller.
 */
describe("User Controller - Full Suite", () => {

  /**
   * Tests for checkUsername
   */
  describe("GET /check-username", () => {
    it("should return exists: true if username is taken", async () => {
      User.exists.mockResolvedValue(true);
      const req = { query: { username: "taken" }, headers: {} };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.checkUsername(req, res);
      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });
  });

  /**
   * Tests for getUserProfile
   */
  describe("GET /users/:id - getUserProfile", () => {
    it("should return user profile successfully", async () => {
      const mockUser = createMockUserDoc();
      User.findById.mockReturnValue(createMockQuery(mockUser));

      const req = { 
        params: { id: mockUser._id.toString() }, 
        user: { userId: "some-id", role: RoleTypeValue.USER },
        headers: {} 
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.getUserProfile(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  /**
   * Tests for updateProfile
   */
  describe("POST /users/:id - updateProfile", () => {
    /**
     * @test Verifies that username changes correctly update the pastUsernames array.
     */
    it("should update profile and archive old username", async () => {
      const userId = new mongoose.Types.ObjectId();
      const existingUser = createMockUserDoc({ _id: userId, username: "oldname" });
      
      User.findById.mockReturnValueOnce(createMockQuery(existingUser)); 
      User.findOne.mockResolvedValue(null); // No conflicts
      User.findById.mockReturnValueOnce(createMockQuery(existingUser)); 

      const req = {
        params: { id: userId.toString() },
        body: { username: "newname", bio: "Updated bio" },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
        headers: {},
        connection: {}
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.updateProfile(req, res);

      expect(existingUser.username).toBe("newname");
      expect(existingUser.pastUsernames).toHaveLength(1);
      expect(existingUser.save).toHaveBeenCalled();
    });
  });

  /**
   * Tests for toggleFollow
   */
  describe("POST /users/toggle-follow", () => {
    it("should allow a user to follow another", async () => {
      const u1Id = new mongoose.Types.ObjectId();
      const u2Id = new mongoose.Types.ObjectId();
      const user1 = createMockUserDoc({ _id: u1Id });
      const user2 = createMockUserDoc({ _id: u2Id });

      User.findById.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      const req = {
        body: { targetId: u2Id.toString() },
        user: { userId: u1Id.toString() },
        headers: {},
        connection: {}
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.toggleFollow(req, res);

      expect(user1.following).toContainEqual(u2Id);
      expect(user2.followers).toContainEqual(u1Id);
      expect(res.json).toHaveBeenCalledWith({ message: "Followed" });
    });
  });

  /**
   * Tests for deleteUser
   */
  describe("DELETE /users/:id - deleteUser", () => {
    /**
     * @test Verifies account deletion and data cleanup across related collections.
     */
    it("should delete account and associated data", async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = createMockUserDoc({ _id: userId, email: "bye@test.com" });

      User.findById.mockResolvedValue(user);
      User.findByIdAndDelete.mockResolvedValue(user);

      const req = {
        params: { id: userId.toString() },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
        headers: {},
        connection: {}
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.deleteUser(req, res);

      // Verify cleanup of dynamic imports via mocked defaults
      expect(Post.deleteMany).toHaveBeenCalled();
      expect(Comment.deleteMany).toHaveBeenCalled();
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId.toString());
      expect(res.json).toHaveBeenCalledWith({ message: "Account and associated content deleted" });
    });
  });
});