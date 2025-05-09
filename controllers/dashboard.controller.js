import Ticket from "../models/ticket.model.js";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import mongoose from 'mongoose';
import Feedback from '../models/feedback.model.js';

export const getTicketOverview = async (req, res) => {
  try {
    // Aggregate counts based on status
    const counts = await Ticket.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Map status counts to keys
    const overview = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    };

    for (const item of counts) {
      overview.total += item.count;
      switch (item._id) {
        case "pending":
          overview.pending = item.count;
          break;
        case "in_progress":
          overview.inProgress = item.count;
          break;
        case "resolved":
          overview.resolved = item.count;
          break;
        default:
          break;
      }
    }

    // If your total includes all tickets regardless of status, consider using .countDocuments() instead
    const totalCount = await Ticket.countDocuments();
    overview.total = totalCount;

    res.status(200).json(overview);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ message: "Failed to fetch ticket overview." });
  }
};

export const getUserStatistics = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, activeToday, newUsers, totalAgents] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: startOfToday } }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.countDocuments({ role: 'agent' })
    ]);

    const stats = {
      totalUsers,
      activeToday,
      newUsers,
      totalAgents
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
};

export const getCustomerSatisfaction = async (req, res) => {
  try {
    const totalCount = await Feedback.countDocuments();

    if (totalCount === 0) {
      return res.status(200).json({
        positive: 0,
        neutral: 0,
        negative: 0
      });
    }

    const ratings = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = { positive: 0, neutral: 0, negative: 0 };

    ratings.forEach(({ _id, count }) => {
      result[_id] = ((count / totalCount) * 100).toFixed(0); // Rounded percentage
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching customer satisfaction:', error);
    res.status(500).json({ message: 'Failed to fetch customer satisfaction' });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const audits = await Audit.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('ticket', '_id') // Only need ticket ID
      .populate('performedBy', 'name') // Assuming User has a 'name' field
      .lean();

    const activityList = audits.map((log) => {
      const user = log.performedBy?.name || 'Unknown Agent';
      const ticketId = log.ticket?._id?.toString().slice(-4) || '0000'; // Use last 4 digits
      const action = log.action.replace(/_/g, ' '); // Friendly label

      return `${user} ${action} ticket ID ${ticketId}`;
    });

    res.status(200).json({ activities: activityList });
  } catch (err) {
    console.error('Error getting recent activity:', err);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
};

export const getRecentTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status priority createdAt') // minimal data needed
      .lean();

    const formatted = tickets.map(ticket => ({
      ticketId: ticket._id.toString().slice(-5), // Show last 5 digits, e.g. #12345
      subject: ticket.title,
      status: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1), // Capitalize
      priority: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1),
      createdAt: ticket.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      _id: ticket._id // still send real ID for "View" link usage
    }));

    res.status(200).json({ recentTickets: formatted });
  } catch (err) {
    console.error('Failed to fetch recent tickets:', err);
    res.status(500).json({ message: 'Error retrieving recent tickets' });
  }
};

export const getAgentPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      status: 'resolved',
    };

    if (startDate && endDate) {
      matchStage.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const aggregation = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$assignedTo',
          resolvedCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentName: {
            $concat: ['$agent.firstName', ' ', '$agent.lastName']
          },
          resolvedCount: 1
        }
      },
      { $sort: { resolvedCount: -1 } }
    ]);

    const totalResolved = aggregation.reduce((sum, agent) => sum + agent.resolvedCount, 0);

    res.status(200).json({
      totalResolved,
      performance: aggregation
    });
  } catch (err) {
    console.error('Agent performance fetch failed:', err);
    res.status(500).json({ message: 'Unable to get agent performance' });
  }
};