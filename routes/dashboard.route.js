// routes/dashboard.routes.js
import express from 'express';
import { getTicketOverview, getUserStatistics } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/overview', getTicketOverview);

router.get('/user-stats', getUserStatistics);
export default router;
