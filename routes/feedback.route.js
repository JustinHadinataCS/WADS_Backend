import express from 'express'
import { getAgentFeedbackSummary, getGlobalFeedbackSummary, getFeedbackForTicket, createFeedback } from '../controllers/feedback.controller.js'; 
import { protect, admin, agent, user } from "../middleware/auth.js";

const router = express.Router();

router.use(protect)
router.get('/agents/:id', agent, getAgentFeedbackSummary)
router.get('/', admin, getGlobalFeedbackSummary)
router.get('/tickets/:id', getFeedbackForTicket)
router.post('/tickets/:id', user, createFeedback)

export default router