import express from 'express';
import { admin, protect} from '../middleware/auth.js';
import { getPerformanceMetrics, getAgentMetrics, getCustomerSatisfaction, getAgentPerformance, getServerResponseTime, getUptimeOverview, getTicketFeedbackTable } from '../controllers/analytic.controller.js';

const router = express.Router();
router.use(protect, admin)

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     summary: Get overall ticket metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
router.get('/metrics', getPerformanceMetrics);

/**
 * @swagger
 * /api/analytics/agents:
 *   get:
 *     summary: Get agent-wise metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/agents', getAgentMetrics);

/**
 * @swagger
 * /api/analytics/customer-satisfaction:
 *   get:
 *     summary: Get customer satisfaction metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/customer-satisfaction', getCustomerSatisfaction);

/**
 * @swagger
 * /api/analytics/agent-performance/{agentId}:
 *   get:
 *     summary: Get performance for a specific agent
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the agent
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/agent-performance/:agentId", getAgentPerformance);

/**
 * @swagger
 * /api/analytics/response-time:
 *   get:
 *     summary: Get average server response time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/response-time', admin, getServerResponseTime);

/**
 * @swagger
 * /api/analytics/server-uptime:
 *   get:
 *     summary: Get server uptime overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/server-uptime', admin, getUptimeOverview);

/**
 * @swagger
 * /api/analytics/feedback/table:
 *   get:
 *     summary: Get feedback data in table form
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/feedback/table', getTicketFeedbackTable);


export default router;
