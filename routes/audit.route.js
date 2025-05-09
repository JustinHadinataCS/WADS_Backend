// routes/audit.routes.js

import express from "express";
import { getRecentAuditLogs, getAllAuditLogs } from "../controllers/audit.controller.js";
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Route for fetching recent audit logs (for dashboard)
router.get("/recent", protect, admin, getRecentAuditLogs);

// Route for fetching all audit logs with pagination
router.get("/", protect, admin, getAllAuditLogs);

export default router;
