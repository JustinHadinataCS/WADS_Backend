import express from 'express'
const router = express.Router();
import { createNotification, deleteNotification, getNotificationById, getNotifications, markAsRead, getAllNotifications } from '../controllers/notification.controller.js';
import { admin, protect, user } from '../middleware/auth.js';

router.use(protect)

// Route to get all notifications for a specific user
router.get('/users/:userId',user, getNotifications);

// Route to get a single notification by ID
router.get('/:notificationId', getNotificationById);

// Route to get all notifications (admin access)
router.get('/', admin, getAllNotifications);

// Route to create a notification
router.post('/', admin, createNotification);

// Route to mark a notification as read
router.put('/:notificationId/read', markAsRead);

// Route to delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;
