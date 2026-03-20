// @ts-nocheck

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as userController from '../src/controllers/user-controller';
import RoleTypeValue from '../src/enums/role-type';

// Mock modules before importing them
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

// Helper to create a mock query that handles chaining and is thenable
function createMockQuery(result: any): any {
  const query: any = {
    then(onfulfilled: any, onrejected?: any) {
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

// Helper to create a mock user document with save method
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

// Mock the User model methods
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

// Access the mocked deleteMany methods
// (Post and Comment are mocked via jest.mock above)

beforeEach(() => {
  jest.clearAllMocks();
  // Set default mock implementations for translation and email
  (getDualTranslation as any).mockImplementation((key: string) =>
    Promise.resolve({ en: key, bg: key })
  );
  (sendEmail as any).mockResolvedValue(undefined);
});

describe('User Controller - CRUD Operations', () => {

  describe('GET /users/:id - getUserProfile', () => {

    it('should return user profile when user exists and is visible', async () => {
      const mockUser = createMockUserDoc();
      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = {
        params: { id: mockUser._id.toString() },
        user: { userId: 'otherId', role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getUserProfile(req, res);

      expect(mockFindById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user does not exist', async () => {
      mockFindById.mockReturnValue(createMockQuery(null));

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { userId: 'someId', role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 404 for non-visible user when not self or admin', async () => {
      const mockUser = createMockUserDoc({ isBanned: true });
      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = {
        params: { id: mockUser._id.toString() },
        user: { userId: 'differentId', role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return user profile for non-visible user when self', async () => {
      const mockUser = createMockUserDoc({ isBanned: true });
      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = {
        params: { id: mockUser._id.toString() },
        user: { userId: mockUser._id.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('POST /users/:id - updateProfile', () => {

    it('should update user profile successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = { bio: 'New bio', username: 'newname' };

      const updatedUser = createMockUserDoc({ _id: userId, username: updates.username, bio: updates.bio });
      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

      const req = {
        params: { id: userId.toString() },
        body: updates,
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 403 when user tries to update another user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      const req = {
        params: { id: userId.toString() },
        body: { bio: 'New bio' },
        user: { userId: otherUserId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });

    it('should allow admin to update any user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = { bio: 'Updated by admin', theme: 'dark' };

      const updatedUser = createMockUserDoc({ _id: userId, bio: updates.bio, theme: updates.theme });
      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

      const req = {
        params: { id: userId.toString() },
        body: updates,
        user: { userId: 'adminId', role: RoleTypeValue.ADMIN },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 when username is already taken', async () => {
      const userId = new mongoose.Types.ObjectId();

      mockFindOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

      const req = {
        params: { id: userId.toString() },
        body: { username: 'existinguser' },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already taken.' });
    });
  });

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
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.toggleFollow(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Followed' });
    });

    it('should unfollow a user when already following', async () => {
      const userId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const user = createMockUserDoc({ _id: userId, following: [targetId] });
      const targetUser = createMockUserDoc({ _id: targetId, followers: [userId] });

      mockFindById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(targetUser);

      const req = {
        body: { targetId: targetId.toString() },
        user: { userId: userId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.toggleFollow(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Unfollowed' });
    });

    it('should return 400 when trying to follow self', async () => {
      const userId = new mongoose.Types.ObjectId();

      const req = {
        body: { targetId: userId.toString() },
        user: { userId: userId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.toggleFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot follow yourself' });
    });

    it('should return 400 when trying to follow non-visible user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const targetId = new mongoose.Types.ObjectId();

      const user = createMockUserDoc({ _id: userId, following: [] });
      const targetUser = createMockUserDoc({ _id: targetId, isBanned: true });

      mockFindById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(targetUser);

      const req = {
        body: { targetId: targetId.toString() },
        user: { userId: userId.toString() },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.toggleFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot follow this user' });
    });
  });

  describe('GET /users/me - getCurrentUser', () => {

    it('should return current user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = createMockUserDoc({ _id: userId });

      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const req = { user: { userId: userId.toString() } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getCurrentUser(req, res);

      expect(mockFindById).toHaveBeenCalledWith(userId.toString());
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when current user does not exist', async () => {
      mockFindById.mockReturnValue(createMockQuery(null));

      const req = { user: { userId: 'nonexistent' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });
  });

  describe('PUT /users/notification-preferences - updateNotificationPreferences', () => {

    it('should update notification preferences successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const preferences = {
        emailReports: false,
        emailComments: true,
        inAppReports: false,
        inAppComments: true,
      };

      const updatedUser = createMockUserDoc({ _id: userId, notificationPreferences: preferences });
      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

      const req = {
        user: { userId: userId.toString() },
        body: { notificationPreferences: preferences },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateNotificationPreferences(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        userId.toString(),
        { notificationPreferences: preferences },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification preferences updated successfully.',
        user: updatedUser,
      });
    });

    it('should return 400 when notification preferences are missing', async () => {
      const req = {
        user: { userId: 'someId' },
        body: {},
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification preferences are required.' });
    });
  });

  describe('PUT /users/email - updateEmail', () => {

    it('should update email successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const newEmail = 'newemail@example.com';

      const updatedUser = createMockUserDoc({ _id: userId, email: newEmail });
      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));
      mockFindOne.mockResolvedValue(null);

      const req = {
        user: { userId: userId.toString() },
        body: { email: newEmail },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateEmail(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        userId.toString(),
        { email: newEmail },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email updated successfully.',
        user: updatedUser,
      });
    });

    it('should return 400 when email is invalid', async () => {
      const req = {
        user: { userId: 'someId' },
        body: { email: 'invalid-email' },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email format.' });
    });

    it('should return 400 when email is already in use', async () => {
      const userId = new mongoose.Types.ObjectId();

      mockFindOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

      const req = {
        user: { userId: userId.toString() },
        body: { email: 'existing@example.com' },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.updateEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use.' });
    });
  });

  describe('GET /users - getAllUsers (All Authenticated Users)', () => {

    it('should return all non-banned regular users (excluding self) for any authenticated user', async () => {
      const currentUserId = 'currentUser';
      const users = [
        createMockUserDoc({ _id: new mongoose.Types.ObjectId(), username: 'user1' }),
        createMockUserDoc({ _id: new mongoose.Types.ObjectId(), username: 'user2' }),
      ];

      mockFind.mockReturnValue(createMockQuery(users));

      const req = {
        user: { userId: currentUserId, role: RoleTypeValue.USER },
      } as any;
      const res = {
        json: jest.fn(),
      } as any;

      await userController.getAllUsers(req, res);

      // Should return users filtered to exclude current user
      const expected = users.filter(u => u._id.toString() !== currentUserId);
      expect(res.json).toHaveBeenCalledWith(expected);
    });

    it('should filter out current user from results', async () => {
      const currentUserId = 'currentUser';
      const otherUser = createMockUserDoc({ _id: new mongoose.Types.ObjectId(), username: 'other' });

      mockFind.mockReturnValue(createMockQuery([otherUser]));

      const req = {
        user: { userId: currentUserId, role: RoleTypeValue.USER },
      } as any;
      const res = { json: jest.fn() } as any;

      await userController.getAllUsers(req, res);

      // Should only return the other user (current user filtered out)
      expect(res.json).toHaveBeenCalledWith([otherUser]);
    });
  });

  describe('DELETE /users/:id - deleteUser', () => {

    it('should delete user account successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = createMockUserDoc({ _id: userId });

      User.findById
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);

      mockFindByIdAndDelete.mockResolvedValue(user);
      (Post as any).deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
      (Comment as any).deleteMany.mockResolvedValueOnce({ deletedCount: 1 });

      const req = {
        params: { id: userId.toString() },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.deleteUser(req, res);

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith(userId.toString());
      expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted' });
    });

    it('should return 404 when user to delete does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      User.findById.mockResolvedValueOnce(null);

      const req = {
        params: { id: userId.toString() },
        user: { userId: userId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 403 when user tries to delete another user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      const user = createMockUserDoc({ _id: userId });

      User.findById.mockResolvedValueOnce(user);

      const req = {
        params: { id: userId.toString() },
        user: { userId: otherUserId.toString(), role: RoleTypeValue.USER },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });
  });
});
