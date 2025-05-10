// routes/dashboard.routes.js
import express from 'express';
import { getTicketOverview, getUserStatistics, getCustomerSatisfaction, getRecentActivity, getRecentTickets, getAgentPerformance, 
    getRecentAgentTickets, getRecentUserTickets, getAgentDashboardStats, getAgentTicketStatus } from '../controllers/dashboard.controller.js';
import { admin, agent, protect, user } from '../middleware/auth.js';

const router = express.Router();

// user dashboard

router.get('/recent-user-ticket/:id', protect, user , getRecentUserTickets)

// agent dashboard

router.get('/recent-agent-ticket', protect, agent, getRecentAgentTickets);

router.get('/agent-stats', protect, agent, getAgentDashboardStats)

router.get('/agent/ticket-status', protect, agent, getAgentTicketStatus);

// admin dashboard

router.get('/overview', protect, admin, getTicketOverview);

router.get('/user-stats', protect, admin, getUserStatistics);

router.get('/customer-satisfaction', protect, admin, getCustomerSatisfaction);

router.get('/recent-activity', protect, admin, getRecentActivity);

router.get('/recent-ticket', protect, admin, getRecentTickets);

router.get('/agent-performance', protect, admin, getAgentPerformance);

export default router;
