import express from "express";
import { createTicket, deleteTicket, getTicket, getTickets, updateTicket, searchAndFilterTickets } from "../controllers/ticket.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect)
router.get("/search", searchAndFilterTickets);
router.get("/", getTickets);
router.get("/:id", getTicket);
router.post("/", createTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;