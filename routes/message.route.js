import express from "express";
import {
  getMessagesByRoom,
  createMessage,
  createRoom,
  getUserRoom,
  agentRoom,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message and chat room API endpoints
 */

/**
 * @swagger
 * /api/messages/agents-room:
 *   get:
 *     summary: Get all chat rooms for an agent
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat rooms for the agent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Room ID
 *                   participants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         name:
 *                           type: string
 *                   lastMessage:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/agents-room", agentRoom);

/**
 * @swagger
 * /api/messages/user/rooms:
 *   get:
 *     summary: Get all chat rooms for a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat rooms for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Room ID
 *                   participants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         name:
 *                           type: string
 *                   lastMessage:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/user/rooms", getUserRoom);

/**
 * @swagger
 * /api/messages/room/{roomId}:
 *   get:
 *     summary: Get all messages in a specific chat room
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         description: ID of the chat room
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages in the room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Message ID
 *                   content:
 *                     type: string
 *                     description: Message content
 *                   sender:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/room/:roomId", getMessagesByRoom);

/**
 * @swagger
 * /api/messages/create-room:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to include in the room
 *     responses:
 *       201:
 *         description: Chat room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Room ID
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create-room", createRoom);

/**
 * @swagger
 * /api/messages/room/{roomId}/message:
 *   post:
 *     summary: Send a message in a chat room
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         description: ID of the chat room
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Message ID
 *                 content:
 *                   type: string
 *                 sender:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     name:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.post("/room/:roomId/message", createMessage);

export default router;
