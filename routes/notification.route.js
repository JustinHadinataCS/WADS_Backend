import express from 'express'
const router = express.Router();
import { createNotification, deleteNotification, getNotificationById, getNotifications, markAsRead, getAllNotifications } from '../controllers/notification.controller.js';

// Route to get all notifications for a specific user
router.get('/users/:userId', getNotifications);

// Route to get a single notification by ID
router.get('/:notificationId', getNotificationById);

// Route to get all notifications (admin access)
router.get('/', getAllNotifications);

// Route to create a notification
router.post('/', createNotification);

// Route to mark a notification as read
router.put('/:notificationId/read', markAsRead);

// Route to delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;
