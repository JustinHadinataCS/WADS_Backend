import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import Audit from "../models/audit.model.js";
import Counter from '../models/counter.model.js';
import User from '../models/user.model.js';
import Notification from "../models/notification.model.js";

// Get all tickets for the current user
export const getTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!req.user || !req.user._id || !req.user.role) {
      console.error("❌ Missing user info in request:", req.user);
      return res.status(401).json({ success: false, message: "Unauthorized or invalid token" });
    }

    console.log("👤 User ID:", req.user._id);
    console.log("🔑 Role:", req.user.role);

    let query = {};

    if (req.user.role === "agent") {
      query = { 'assignedTo.userId': req.user._id };
    } else if (req.user.role === "user") {
      query = { "user.userId": req.user._id };
    } else if (req.user.role === "admin") {
      query = {}; // Admin sees all tickets
    } else {
      return res.status(403).json({ success: false, message: "Forbidden: Unknown role" });
    }

    const tickets = await Ticket.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalTickets = await Ticket.countDocuments(query);

    console.log("✅ Tickets fetched:", tickets.length);

    res.status(200).json({
      success: true,
      data: tickets,
      currentPage: page,
      totalPages: Math.ceil(totalTickets / limit),
      totalTickets: totalTickets,
    });
  } catch (error) {
    console.error("🚨 Error fetching tickets:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a specific ticket by ID
export const getTicket = async (req, res) => {
	const { id } = req.params;
	try {

		const ticket = await Ticket.findOne({ _id: id, 'user.userId': req.user._id });
		if (!ticket) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}
		res.status(200).json({ success: true, data: ticket });
	} catch (error) {
		console.log("Error in fetching ticket:", error.message);
		res.status(500).json({ success: false, message: "Server Error" });
	}
};

export const createTicket = async (req, res) => {
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
        userId: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      },
      assignedTo: {
        userId: assignedAgent._id,
        firstName: assignedAgent.firstName,
        lastName: assignedAgent.lastName,
        email: assignedAgent.email
      },
      activityLog: [
        { action: 'created', performedBy: req.user._id },
        { action: 'assigned', performedBy: req.user._id, newValue: assignedAgent._id }
      ]
    });

    await newTicket.save();

    // Audit log
    const auditLog = new Audit({
      ticket: newTicket._id,
	  ticketId: newTicket._id.toString(),
      action: 'created',
      performedBy: req.user._id,
      timestamp: new Date()
    });
    await auditLog.save();

   	// 🔔 User Notification
    const userNotification = new Notification({
      userId: req.user._id,
      title: 'Ticket Submitted',
      content: `Your ticket "${ticketData.title}" has been successfully created and assigned to an agent.`,
      type: 'ticket',
      priority: 'low',
      link: `/tickets/${newTicket._id}`
    });

    // 🔔 Agent Notification
    const agentNotification = new Notification({
      userId: assignedAgent._id,
      title: 'New Ticket Assigned',
      content: `A new ticket "${ticketData.title}" has been assigned to you.`,
      type: 'ticket',
      priority: 'medium',
      link: `/tickets/${newTicket._id}`
    });

	// 🔔 Admin Notification
	const adminNotification = new Notification({
	title: 'New Ticket Created',
	content: `A new ticket "${ticketData.title}" has been created and assigned to Agent ${assignedAgent.firstName+" "+assignedAgent.lastName}.`,
	type: 'ticket',
	priority: 'medium',
	link: `/tickets/${newTicket._id}`,
	isAdminNotification: true
	});

  	await Promise.all([
        userNotification.save(),
        agentNotification.save(),
        adminNotification.save()
        ]);

    res.status(201).json({ success: true, data: newTicket });

  } catch (error) {
    console.error('Error in creating ticket:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update an existing ticket
export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const ticketData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: "Invalid Ticket ID" });
  }

  try {
    const ticket = await Ticket.findOne({ _id: id, 'user.userId': req.user._id });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found or not authorized" });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(id, ticketData, { new: true });

    // Audit Log: Ticket update
    const auditLog = new Audit({
      ticket: updatedTicket._id,
	  ticketId: updatedTicket._id.toString(),
      action: 'updated',
      performedBy: req.user._id,
      timestamp: new Date()
    });
    await auditLog.save();

    // 🔔 User Notification
    const userNotification = new Notification({
      userId: req.user._id,
      title: 'Ticket Updated',
      content: `Your ticket "${updatedTicket.title}" has been updated.`,
      type: 'ticket',
      priority: 'low',
      link: `/tickets/${updatedTicket._id}`
    });

	// 🔔 AgentNotification
    const agentNotification = new Notification({
      userId: updatedTicket.assignedTo,
      title: 'Ticket Updated',
      content: `Ticket "${updatedTicket.title}" assigned to you has been updated by the user.`,
      type: 'ticket',
      priority: 'low',
      link: `/tickets/${updatedTicket._id}`
    });

	// 🔔 Admin Notification
	const adminNotification = new Notification({
	title: 'Ticket Updated',
	content: `Ticket "${updatedTicket.title}" has been updated by the user.`,
	type: 'ticket',
	priority: 'low',
	link: `/tickets/${updatedTicket._id}`,
	isAdminNotification: true
	});


     await Promise.all([
        userNotification.save(),
        agentNotification.save(),
        adminNotification.save()
        ]);

    res.status(200).json({ success: true, data: updatedTicket });
  } catch (error) {
    console.log("Error in updating ticket:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const deleteTicket = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: "Invalid Ticket Id" });
  }

  try {
    const ticket = await Ticket.findOne({ _id: id, 'user.userId': req.user._id });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found or not authorized" });
    }

    const deletedTicket = await Ticket.findByIdAndDelete(id);

    // Audit Log: Ticket deletion
    const auditLog = new Audit({
      ticket: deletedTicket._id,
	  ticketId: deletedTicket._id.toString(),
      action: 'deleted',
      performedBy: req.user._id,
      timestamp: new Date()
    });
    await auditLog.save();

    // 🔔 User Notification
    const userNotification = new Notification({
      userId: req.user._id,
      title: 'Ticket Deleted',
      content: `Your ticket "${ticket.title}" has been deleted.`,
      type: 'ticket',
      priority: 'low',
      link: `/tickets`
    });

	// 🔔 Agent Notification
    const agentNotification = new Notification({
      userId: ticket.assignedTo,
      title: 'Ticket Deleted',
      content: `Ticket "${ticket.title}" assigned to you has been deleted by the user.`,
      type: 'ticket',
      priority: 'low',
      link: `/tickets`
    });

	// 🔔 Admin Notification
	const adminNotification = new Notification({
	title: 'Ticket Deleted',
	content: `Ticket "${ticket.title}" has been deleted by the user.`,
	type: 'ticket',
	priority: 'low',
	link: `/tickets`,
	isAdminNotification: true
	});

     await Promise.all([
        userNotification.save(),
        agentNotification.save(),
        adminNotification.save()
        ]);

    res.status(200).json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    console.error("Error in deleting ticket:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
