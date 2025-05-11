import Audit from "../models/audit.model.js";

const getAuditDescription = (log) => {
  const user = log.performedBy;
  const userName = user ? `${user.firstName} ${user.lastName}` : "Someone";

  const ticketId = log.ticket?._id?.toString() || log.ticketId || "xxxxx";
  const shortTicketId = ticketId.slice(-5);

  switch (log.action) {
    case 'created':
      return `${userName} created ticket #${shortTicketId}`;
    case 'updated':
      return `${userName} updated ticket #${shortTicketId}`;
    case 'resolved':
      return `${userName} resolved ticket #${shortTicketId}`;
    case 'deleted':
      return `${userName} deleted ticket #${shortTicketId}`;
    default:
      return `${userName} performed an action on ticket #${shortTicketId}`;
  }
};

// Get recent audit logs (e.g., for the dashboard)
export const getRecentAuditLogs = async (req, res) => {
  try {
    const auditLogs = await Audit.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate({ path: 'ticket', select: 'title' })
      .populate({ path: 'performedBy', select: 'firstName lastName email' });

    const logsWithDescription = auditLogs.map(log => ({
      ...log.toObject(),
      description: getAuditDescription(log),
    }));

    res.status(200).json({ success: true, data: logsWithDescription });
  } catch (error) {
    console.error("Error fetching recent audit logs:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Get all audit logs with pagination
export const getAllAuditLogs = async (req, res) => {
    try {
      // Default to page 1 and limit 20 logs per page
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
  
      // Fetch all audit logs with pagination
      const auditLogs = await Audit.find()
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 })  // Sort by most recent first
        .populate('ticket')  // Optional: populate ticket details
        .populate('performedBy');  // Optional: populate user who performed action
  
      // Fetch the total number of audit logs for pagination
      const totalLogs = await Audit.countDocuments();
  
      res.status(200).json({
        success: true,
        data: auditLogs,
        pagination: {
          total: totalLogs,
          page,
          pages: Math.ceil(totalLogs / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching all audit logs:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };