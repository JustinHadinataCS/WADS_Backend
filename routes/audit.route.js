// routes/audit.routes.js

import express from "express";
import { getRecentAuditLogs, getAllAuditLogs } from "../controllers/audit.controller.js";

const router = express.Router();

// Route for fetching recent audit logs (for dashboard)
router.get("/recent", getRecentAuditLogs);

// Route for fetching all audit logs with pagination
router.get("/", getAllAuditLogs);

export default router;
