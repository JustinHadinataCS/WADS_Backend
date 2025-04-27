import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import TemporaryUser from "../models/ticket.model.js"; // Assuming you will replace this with the actual User model

// Get all tickets
export const getTickets = async (req, res) => {
	try {
		const tickets = await Ticket.find({}).populate('user.userId').exec(); // Removed assignedTo
		res.status(200).json({ success: true, data: tickets });
	} catch (error) {
		console.log("Error in fetching tickets:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

// Get a specific ticket by ID
export const getTicket = async (req, res) => {
	const { id } = req.params;
	try {
		const ticket = await Ticket.findById(id).populate('user.userId').exec(); // Removed assignedTo
		if (!ticket) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}
		res.status(200).json({ success: true, data: ticket });
	} catch (error) {
		console.log("Error in fetching ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

// Create a new ticket
export const createTicket = async (req, res) => {
	const ticketData = req.body;

	// Validate required fields
	if (!ticketData.title || !ticketData.category || !ticketData.description || !ticketData.department || !ticketData.priority) {
		return res.status(400).json({ success: false, message: "Please provide all required fields" });
	}

	// Removed assignedTo validation

	const newTicket = new Ticket({
		...ticketData,
		user: {
			userId: ticketData.userId,
			firstName: ticketData.firstName,
			lastName: ticketData.lastName,
			email: ticketData.email
		}
	});

	try {
		await newTicket.save();
		res.status(201).json({ success: true, data: newTicket });
	} catch (error) {
		console.error("Error in creating ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

// Update an existing ticket
export const updateTicket = async (req, res) => {
	const { id } = req.params;
	const ticketData = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ success: false, message: "Invalid Ticket Id" });
	}

	// Removed assignedTo validation

	try {
		const updatedTicket = await Ticket.findByIdAndUpdate(id, ticketData, { new: true }).populate('user.userId').exec(); // Removed assignedTo
		if (!updatedTicket) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}
		res.status(200).json({ success: true, data: updatedTicket });
	} catch (error) {
		console.log("Error in updating ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

// Delete a ticket
export const deleteTicket = async (req, res) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ success: false, message: "Invalid Ticket Id" });
	}

	try {
		const deletedTicket = await Ticket.findByIdAndDelete(id);
		if (!deletedTicket) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}
		res.status(200).json({ success: true, message: "Ticket deleted" });
	} catch (error) {
		console.log("Error in deleting ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};
