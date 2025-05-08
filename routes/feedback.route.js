import express from 'express'
import { getAgentFeedbackSummary, getGlobalFeedbackSummary, getFeedbackForTicket, createFeedback } from '../controllers/feedback.controller.js'; 

const router = express.Router();

router.get('/agents/:id', getAgentFeedbackSummary)
router.get('/', getGlobalFeedbackSummary)
router.get('/tickets/:id', getFeedbackForTicket)
router.post('/tickets/:id', createFeedback)

export default router