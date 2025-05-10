// routes/dashboard.routes.js
import express from 'express';
import { getTicketOverview, getUserStatistics, getCustomerSatisfaction, getRecentActivity, getRecentTickets, getAgentPerformance, 
    getRecentAgentTickets, getRecentUserTickets, getAgentDashboardStats, getAgentTicketStatus, getServerResponseTime, getUptimeOverview } from '../controllers/dashboard.controller.js';
import { admin, agent, protect, user } from '../middleware/auth.js';

const router = express.Router();
router.use(protect)

// user dashboard

router.get('/recent-user-ticket', user , getRecentUserTickets)

// agent dashboard

router.get('/recent-agent-ticket', agent, getRecentAgentTickets);
router.get('/agent-stats', agent, getAgentDashboardStats)
router.get('/agent/ticket-status', agent, getAgentTicketStatus);

// admin dashboard

router.get('/overview', admin, getTicketOverview);
router.get('/user-stats', admin, getUserStatistics);
router.get('/customer-satisfaction', admin, getCustomerSatisfaction);
router.get('/recent-activity', admin, getRecentActivity);
router.get('/recent-ticket', admin, getRecentTickets);
router.get('/agent-performance', admin, getAgentPerformance);
router.get('/response-time', admin, getServerResponseTime);
router.get('/server-uptime', admin, getUptimeOverview);


export default router;
