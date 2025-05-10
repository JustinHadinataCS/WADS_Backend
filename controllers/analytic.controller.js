import Ticket from '../models/ticket.model.js';
import Feedback from '../models/feedback.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import responseTime from "../models/responseTime.model.js";
import uptimeLog from '../models/uptimeLog.model.js';

export const getPerformanceMetrics = async (req, res) => {
  try {
    const [total, inProgress, pending, resolved] = await Promise.all([
      Ticket.countDocuments({}),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: 'resolved' }),
    ]);

    const resolvedTickets = await Ticket.find({ status: 'resolved' }, 'createdAt updatedAt');

    const totalResolutionTimeInMs = resolvedTickets.reduce((acc, ticket) => {
      return acc + (new Date(ticket.updatedAt) - new Date(ticket.createdAt));
    }, 0);

    const avgResolutionTimeMs = resolvedTickets.length > 0
      ? totalResolutionTimeInMs / resolvedTickets.length
      : 0;

    const totalSeconds = Math.floor(avgResolutionTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const avgResolutionTimeFormatted = `${hours} hrs ${minutes} mins ${seconds} secs`;

    res.json({
      totalTickets: total,
      ticketsInProgress: inProgress,
      ticketsPending: pending,
      ticketsResolved: resolved,
      avgResolutionTime: avgResolutionTimeFormatted
    });
  } catch (err) {
    console.error('Error fetching metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};


export const getAgentMetrics = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' });

    const categoryCounts = {
      category1: 0,
      category2: 0,
      category3: 0
    };

    // Example: You might use some logic to categorize agents by department or performance
    agents.forEach((agent, index) => {
      if (index % 3 === 0) categoryCounts.category1++;
      else if (index % 3 === 1) categoryCounts.category2++;
      else categoryCounts.category3++;
    });

    res.json({
      totalAgents: agents.length,
      categoryDistribution: categoryCounts
    });
  } catch (error) {
    console.error('Agent metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch agent metrics' });
  }
};

export const getCustomerSatisfaction = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({});

    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    feedbacks.forEach(feedback => {
      distribution[feedback.rating]++;
    });

    const total = feedbacks.length;

    const response = {
      totalResponses: total,
      distribution: {
        positive: {
          count: distribution.positive,
          percentage: total > 0 ? (distribution.positive / total * 100).toFixed(2) : 0
        },
        neutral: {
          count: distribution.neutral,
          percentage: total > 0 ? (distribution.neutral / total * 100).toFixed(2) : 0
        },
        negative: {
          count: distribution.negative,
          percentage: total > 0 ? (distribution.negative / total * 100).toFixed(2) : 0
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Customer satisfaction error:', error);
    res.status(500).json({ error: 'Failed to fetch customer satisfaction data' });
  }
};

export const getAgentPerformance = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Invalid agent ID format" });
    }

    const agent = await User.findById(agentId);

    if (!agent || agent.role !== "agent") {
      return res.status(404).json({ error: "Agent not found or invalid role" });
    }

    const tickets = await Ticket.find({ assignedTo: agentId });

    const ticketsResolved = tickets.filter(t => t.status === "resolved");
    const ticketsInProgress = tickets.filter(t => t.status === "in_progress");
    const ticketsPending = tickets.filter(t => t.status === "pending");

    const resolutionTimes = ticketsResolved.map(ticket => {
      return (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / 1000; // in seconds
    });

    const avgResolutionSeconds = resolutionTimes.length
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Format resolution time into HH:MM:SS
    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hrs}h ${mins}m ${secs}s`;
    };

    const feedbacks = await Feedback.find({ agent: agentId });

    const totalResponses = feedbacks.length;
    const positiveCount = feedbacks.filter(f => f.rating === "positive").length;
    const neutralCount = feedbacks.filter(f => f.rating === "neutral").length;
    const negativeCount = feedbacks.filter(f => f.rating === "negative").length;

    const satisfaction = {
      positive: totalResponses ? (positiveCount / totalResponses) * 100 : 0,
      neutral: totalResponses ? (neutralCount / totalResponses) * 100 : 0,
      negative: totalResponses ? (negativeCount / totalResponses) * 100 : 0
    };

    const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in ms
    const isAvailable = Date.now() - new Date(agent.lastLogin).getTime() <= TEN_MINUTES;

    const performanceData = {
      ticketsResolved: ticketsResolved.length,
      ticketsInProgress: ticketsInProgress.length,
      ticketsPending: ticketsPending.length,
      avgResolutionTime: formatTime(avgResolutionSeconds),
      department: agent.department || 'Not Assigned',
      availability: isAvailable ? 'Available' : 'Unavailable',
      satisfaction: {
        totalResponses,
        positive: Math.round(satisfaction.positive),
        neutral: Math.round(satisfaction.neutral),
        negative: Math.round(satisfaction.negative)
      }
    };

    res.json(performanceData);
  } catch (error) {
    console.error("Error fetching agent performance:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const getTicketFeedbackTable = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .populate('ticket')
      .populate('createdBy', 'firstName lastName email')
      .populate('agent', 'firstName lastName email')
      .lean();

    const tableData = feedbacks.map(fb => {
      const ticket = fb.ticket;
      const user = fb.createdBy;
      const agent = fb.agent;

      const resolutionTime = ticket.updatedAt && ticket.createdAt
        ? Math.ceil((new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60)) + ' mins'
        : 'N/A';

      return {
        ticketId: ticket._id.toString(),
        userId: user?._id.toString(),
        category: ticket.category,
        priority: ticket.priority,
        agentAssigned: agent ? `${agent.firstName} ${agent.lastName}` : 'Unassigned',
        resolutionTime,
        feedbackScore: fb.rating,
        details: `/tickets/${ticket._id}` // for "View" link on frontend
      };
    });

    res.status(200).json({ success: true, data: tableData });

  } catch (error) {
    console.error('Failed to fetch ticket feedback table:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket feedback table' });
  }
};

//////////////////////////////////////////////////////////
// SERVER PERFORMANCE METRICS////////////////////////////
////////////////////////////////////////////////////////

// Response Time logs

export const getServerResponseTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours
    const end = endDate ? new Date(endDate) : new Date();

    const metrics = await responseTime.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$timestamp" },
                { $mod: [{ $toLong: "$timestamp" }, 1000 * 60 * 10] } // 10 min buckets
              ]
            }
          },
          avgResponseTimeMs: { $avg: "$durationMs" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          interval: "$_id",
          avgResponseTimeMs: { $round: ["$avgResponseTimeMs", 2] },
          count: 1
        }
      }
    ]);

    res.json(metrics);
  } catch (err) {
    console.error('Error fetching server metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

// Uptime logs

// Helper to calculate uptime percentage for a given period
async function calculateUptimeForPeriod(start, end) {
  const logs = await uptimeLog.find({
    timestamp: { $gte: start, $lte: end }
  }).sort({ timestamp: 1 });

  if (logs.length < 2) return 100; // Assume 100% if not enough data

  let totalUp = 0, totalDown = 0;
  for (let i = 0; i < logs.length - 1; i++) {
    const duration = logs[i + 1].timestamp - logs[i].timestamp;
    if (logs[i].status === 'up') totalUp += duration;
    else totalDown += duration;
  }
  const total = totalUp + totalDown;
  return total ? (totalUp / total) * 100 : 100;
}

export const getUptimeOverview = async (req, res) => {
  try {
    const now = new Date();
    const periods = {
      last24h: [new Date(now - 24 * 60 * 60 * 1000), now],
      last7d: [new Date(now - 7 * 24 * 60 * 60 * 1000), now],
      last30d: [new Date(now - 30 * 24 * 60 * 60 * 1000), now],
      last90d: [new Date(now - 90 * 24 * 60 * 60 * 1000), now],
    };

    const [uptime24h, uptime7d, uptime30d, uptime90d] = await Promise.all([
      calculateUptimeForPeriod(...periods.last24h),
      calculateUptimeForPeriod(...periods.last7d),
      calculateUptimeForPeriod(...periods.last30d),
      calculateUptimeForPeriod(...periods.last90d),
    ]);

    // Current status (last log)
    const lastLog = await uptimeLog.findOne().sort({ timestamp: -1 });
    const currentStatus = lastLog?.status === 'up' ? 'Operational' : 'Down';

    res.json({
      currentStatus,
      uptime: {
        '24h': uptime24h.toFixed(3),
        '7d': uptime7d.toFixed(3),
        '30d': uptime30d.toFixed(3),
        '90d': uptime90d.toFixed(3),
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to compute uptime overview' });
  }
};