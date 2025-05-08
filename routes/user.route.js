// FILE: routes/userRoutes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateNotificationSettings,
  updateSecuritySettings,
  googleLogin,
  googleCallback,
  checkUserExists
} from '../controllers/user.controller.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/check', checkUserExists);
router.post('/', registerUser);
router.post('/login', loginUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

// Notification and security settings routes
router.put('/:id/notifications', protect, updateNotificationSettings);
router.put('/:id/security', protect, updateSecuritySettings);

// Google OAuth routes
router.get('/auth/google', googleLogin);
router.get('/auth/google/callback', googleCallback);

export default router;
