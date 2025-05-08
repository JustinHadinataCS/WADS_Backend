import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import Audit from "../models/audit.model.js";
import TemporaryUser from "../models/ticket.model.js"; // Assuming you will replace this with the actual User model
import Counter from '../models/counter.model.js';
import User from '../models/user.model.js';

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

// Get a specific ticket by ID
export const createTicket = async (req, res) => {
	req.user = { _id: new mongoose.Types.ObjectId() }; // Temporary mock for testing
  
	const ticketData = req.body;
  
	// Validate required fields
	if (!ticketData.title || !ticketData.category || !ticketData.description || !ticketData.department) {
	  return res.status(400).json({ success: false, message: 'Please provide all required fields' });
	}
  
	try {
	  // Round-robin agent assignment
	  const agents = await User.find({ role: 'agent' }).sort({ _id: 1 });
	  if (agents.length === 0) {
		return res.status(400).json({ success: false, message: 'No agents available for assignment' });
	  }
  
	  let counter = await Counter.findOne({ key: 'agent_rr_index' });
	  if (!counter) {
		counter = await Counter.create({ key: 'agent_rr_index', value: 0 });
	  }
  
	  const agentIndex = counter.value % agents.length;
	  const assignedAgent = agents[agentIndex];
  
	  // Update counter
	  counter.value = (counter.value + 1) % agents.length;
	  await counter.save();
  
	  // Create the ticket with assigned agent
	  const newTicket = new Ticket({
		...ticketData,
		user: {
		  userId: ticketData.userId,
		  firstName: ticketData.firstName,
		  lastName: ticketData.lastName,
		  email: ticketData.email
		},
		assignedTo: assignedAgent._id,
		activityLog: [{
		  action: 'created',
		  performedBy: req.user._id
		}, {
		  action: 'assigned',
		  performedBy: req.user._id,
		  newValue: assignedAgent._id
		}]
	  });
  
	  await newTicket.save();
  
	  // Audit log
	  const auditLog = new Audit({
		ticket: newTicket._id,
		action: 'created',
		performedBy: req.user._id,
		timestamp: new Date()
	  });
	  await auditLog.save();
  
	  res.status(201).json({ success: true, data: newTicket });
  
	} catch (error) {
	  console.error('Error in creating ticket:', error.message);
	  res.status(500).json({ success: false, message: 'Server Error' });
	}
};

// Update an existing ticket
export const updateTicket = async (req, res) => {

	req.user = { _id: new mongoose.Types.ObjectId() }; // Temporary mock for testing


	const { id } = req.params;
	const ticketData = req.body;


	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({ success: false, message: "Invalid Ticket Id" });
	}

	// Removed assignedTo validation

	try {
		const updatedTicket = await Ticket.findByIdAndUpdate(id, ticketData, { new: true,  context: { user: req.user } }).populate('user.userId').exec(); // Removed assignedTo
		if (!updatedTicket) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}

		// Audit Log: Ticket update
		const auditLog = new Audit({
			ticket: updatedTicket._id,
			action: 'updated',
			performedBy: req.user._id,  // Assuming req.user is the logged-in user
			timestamp: new Date()
		});
		await auditLog.save();  // Save the audit log

		res.status(200).json({ success: true, data: updatedTicket });
	} catch (error) {
		console.log("Error in updating ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

export const deleteTicket = async (req, res) => {
    req.user = { _id: new mongoose.Types.ObjectId() }; // Temporary mock for testing

    const { id } = req.params;

    console.log("Deleting ticket with ID:", id); // Log the ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Ticket Id" });
    }

    try {
        const deletedTicket = await Ticket.findByIdAndDelete(id);
        console.log("Deleted ticket:", deletedTicket); // Log the result of deletion

        if (!deletedTicket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Audit Log: Ticket deletion
        const auditLog = new Audit({
            ticket: deletedTicket._id,
            action: 'deleted',
            performedBy: req.user._id,  // Assuming req.user is the logged-in user
            timestamp: new Date()
        });
        await auditLog.save();  // Save the audit log

        res.status(200).json({ success: true, message: "Ticket deleted" });
    } catch (error) {
        console.error("Error in deleting ticket:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
