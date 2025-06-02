import express from 'express';
import { 
    chatWithGemini, 
    getChatHistory, 
    deleteChat, 
    updateChat 
} from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat API endpoints
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to Gemini AI and get a response
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message to send to Gemini AI
 *     responses:
 *       200:
 *         description: Successful response from Gemini AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: The AI's response message
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, chatWithGemini);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get chat history for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Chat message ID
 *                   message:
 *                     type: string
 *                     description: The message content
 *                   response:
 *                     type: string
 *                     description: The AI's response
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: When the message was sent
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', authenticateToken, getChatHistory);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   delete:
 *     summary: Delete a specific chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: ID of the chat message to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat message deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat message not found
 *       500:
 *         description: Server error
 */
router.delete('/:chatId', authenticateToken, deleteChat);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   patch:
 *     summary: Update a specific chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: ID of the chat message to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Updated message content
 *               response:
 *                 type: string
 *                 description: Updated AI response
 *     responses:
 *       200:
 *         description: Chat message updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat message not found
 *       500:
 *         description: Server error
 */
router.patch('/:chatId', authenticateToken, updateChat);

export default router; 