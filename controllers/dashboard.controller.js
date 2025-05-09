import Ticket from "../models/ticket.model.js";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";
import mongoose from 'mongoose';

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