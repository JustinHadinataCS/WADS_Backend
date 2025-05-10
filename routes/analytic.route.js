import express from 'express';
import { admin, protect} from '../middleware/auth.js';
import { getPerformanceMetrics, getAgentMetrics, getCustomerSatisfaction, getAgentPerformance, getServerResponseTime, getUptimeOverview, getTicketFeedbackTable } from '../controllers/analytic.controller.js';

const router = express.Router();
router.use(protect, admin)

router.get('/metrics', getPerformanceMetrics);
router.get('/agents', getAgentMetrics);
router.get('/customer-satisfaction', getCustomerSatisfaction);
router.get("/agent-performance/:agentId", getAgentPerformance);
router.get('/response-time', admin, getServerResponseTime);
router.get('/server-uptime', admin, getUptimeOverview);
router.get('/feedback/table', getTicketFeedbackTable);


export default router;
