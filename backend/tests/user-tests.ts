/**
 * @file user-tests.ts
 * @description Unit tests for user controller.
 * Tests profile management, follow/unfollow, and account deletion.
 * Uses Jest with mocked Mongoose models and utilities.
 *
 * Run with: `npm test` or `jest`
 */

// @ts-nocheck

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as userController from '../src/controllers/user-controller';
import RoleTypeValue from '../src/enums/role-type';

// module mocks
jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../src/utils/translation', () => ({
  getDualTranslation: jest.fn(),
}));

jest.mock('../src/models/notification');

jest.mock('../src/models/post', () => ({
  __esModule: true,
  default: {
    deleteMany: jest.fn(),
  },
}));

jest.mock('../src/models/comment', () => ({
  __esModule: true,
  default: {
    deleteMany: jest.fn(),
  },
}));

import User from '../src/models/user';
import Post from '../src/models/post';
import Comment from '../src/models/comment';
import { sendEmail } from '../src/utils/email';
import { getDualTranslation } from '../src/utils/translation';

// mock query helper
function createMockQuery(result) {
  const query = {
    then(onfulfilled, onrejected) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
    exec: jest.fn().mockReturnValue(Promise.resolve(result)),
  };
  query.select = jest.fn().mockReturnValue(query);
  query.populate = jest.fn().mockReturnValue(query);
  query.sort = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  return query;
}

// user document helper
const createMockUserDoc = (overrides = {}) => {
  const mockSave = jest.fn().mockResolvedValue(this);
  const base = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: RoleTypeValue.USER,
    profileImage: '',
    bio: '',
    isApproved: true,
    isBanned: false,
    translations: { bio: { bg: '', en: '' } },
    notificationPreferences: {
      emailReports: true,
      emailComments: true,
      inAppReports: true,
      inAppComments: true,
    },
    theme: 'cream',
    language: 'en',
    createdAt: new Date(),
    followers: [],
    following: [],
    save: mockSave,
  };
  return { ...base, ...overrides, save: mockSave };
};

// model method mocks
const mockFindById = jest.fn();
const mockFindOne = jest.fn();
const mockExists = jest.fn();
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockDeleteMany = jest.fn();

User.findById = mockFindById;
User.findOne = mockFindOne;
User.exists = mockExists;
User.find = mockFind;
User.findByIdAndUpdate = mockFindByIdAndUpdate;
User.findAndUpdate = mockFindAndUpdate;
User.findByIdAndDelete = mockFindByIdAndDelete;
User.deleteMany = mockDeleteMany;

// test setup
beforeEach(() => {
  jest.clearAllMocks();
  getDualTranslation.mockImplementation((key) =>
    Promise.resolve({ en: key, bg: key })
  );
  sendEmail.mockResolvedValue(undefined);
});

// user tests
describe('User Controller - CRUD Operations', () => {

  // get user profile
  describe('GET /users/:id - getUserProfile', () => {
    it('should return user profile when user exists and is visible', async () => {
      const mockUser = createMockUserDoc();
      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = {
        params: { id: mockUser._id.toString() },
        user: { userId: 'otherId', role: RoleTypeValue.USER },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.getUserProfile(req, res);

      expect(mockFindById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user does not exist', async () => {
      mockFindById.mockReturnValue(createMockQuery(null));

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { userId: 'someId', role: RoleTypeValue.USER },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  // update profile
  describe('POST /users/:id - updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = { bio: 'New bio', username: 'newname' };
      const updatedUser = createMockUserDoc({ _id: userId, ...updates });

      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

      const req = {
        params: { id: userId.toString() },
        body: updates,
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.updateProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  // toggle follow
  describe('POST /users/toggle-follow - toggleFollow', () => {
    it('should follow a user successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const user = createMockUserDoc({ _id: userId, following: [] });
      const targetUser = createMockUserDoc({ _id: targetId, followers: [] });

      mockFindById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(targetUser);

      const req = {
        body: { targetId: targetId.toString() },
        user: { userId: userId.toString() },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.toggleFollow(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Followed' });
    });
  });

  // get current user
  describe('GET /users/me - getCurrentUser', () => {
    it('should return current user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = createMockUserDoc({ _id: userId });

      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = { user: { userId: userId.toString() } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.getCurrentUser(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  // delete user
  describe('DELETE /users/:id - deleteUser', () => {
    it('should delete user account successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = createMockUserDoc({ _id: userId });

      User.findById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      mockFindByIdAndDelete.mockResolvedValue(user);
      Post.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      Comment.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });

      const req = {
        params: { id: userId.toString() },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.deleteUser(req, res);

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith(userId.toString());
      expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted' });
    });
  });
});