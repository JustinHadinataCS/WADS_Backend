import express from "express";
import { createTicket, deleteTicket, getTicket, getTickets, updateTicket } from "../controllers/ticket.controller.js";

const router = express.Router();

router.get("/", getTickets);
router.get("/:id", getTicket);
router.post("/", createTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;