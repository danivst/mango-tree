import express, { Router } from "express";
import RoleTypeValue from "../enums/role-type";
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getAllUsers,
  getAllAdmins,
  deleteUser,
  getCurrentUser,
  checkUsername,
  updateNotificationPreferences,
  updateEmail,
  getRegularUsers,
  getFollowers,
  getFollowing,
  removeFollower,
} from "../controllers/user-controller";
import { auth, requireRole } from "../utils/auth";

const router: Router = express.Router();

// Username check route FIRST
router.get("/check-username", auth, checkUsername);

router.get("/me", auth, getCurrentUser);
router.put("/me", auth, updateProfile); // Allow updating current user's profile
router.put("/me/settings", auth, updateNotificationPreferences);
router.put("/me/email", auth, updateEmail);

// New endpoint for regular users to search other regular users
// Must be BEFORE /:id route to avoid matching "regular" as an ID
router.get("/regular", auth, getRegularUsers);

// Admin only endpoint to get all admin users
router.get("/admins", auth, requireRole(RoleTypeValue.ADMIN), getAllAdmins);

router.get("/:id/followers", auth, getFollowers);
router.get("/:id/following", auth, getFollowing);
router.delete("/followers/:followerId", auth, removeFollower);

router.get("/:id", auth, getUserProfile);
router.put("/:id", auth, updateProfile);
router.post("/follow", auth, toggleFollow);

router.get("/", auth, getAllUsers);
router.delete("/:id", auth, deleteUser);

export default router;
