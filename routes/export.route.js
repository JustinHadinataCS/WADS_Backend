import express from 'express';
import { exportTickets } from '../controllers/export.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Export API endpoints
 */

/**
 * @swagger
 * /api/export/tickets:
 *   get:
 *     summary: Export tickets data to CSV format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering tickets (YYYY-MM-DD)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering tickets (YYYY-MM-DD)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [open, in-progress, resolved, closed]
 *         description: Filter tickets by status
 *       - name: department
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter tickets by department
 *     responses:
 *       200:
 *         description: CSV file containing tickets data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV file with ticket data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tickets', protect, exportTickets);

export default router;
