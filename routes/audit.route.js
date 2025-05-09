// routes/audit.routes.js

import express from "express";
import { getRecentAuditLogs, getAllAuditLogs } from "../controllers/audit.controller.js";
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: API for managing audit logs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         action:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             email:
 *               type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         details:
 *           type: object
 */

/**
 * @swagger
 * /api/audit/recent:
 *   get:
 *     summary: Get recent audit logs (for dashboard)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/recent", protect, admin, getRecentAuditLogs); // Route for fetching recent audit logs (for dashboard)

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audit logs with pagination (Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: Paginated list of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", protect, admin, getAllAuditLogs); // Route for fetching all audit logs with pagination

export default router;
