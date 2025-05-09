// routes/dashboard.routes.js
import express from 'express';
import { getTicketOverview, getUserStatistics, getCustomerSatisfaction, getRecentActivity, getRecentTickets, getAgentPerformance } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/overview', getTicketOverview);

router.get('/user-stats', getUserStatistics);

router.get('/customer-satisfaction', getCustomerSatisfaction);

router.get('/recent-activity', getRecentActivity);

router.get('/recent-ticket', getRecentTickets);

router.get('/agent-performance', getAgentPerformance);

export default router;
