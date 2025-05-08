import Ticket from "../models/ticket.model.js";
import User from "../models/user.model.js";
import Audit from "../models/audit.model.js";

// Get overall dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const totalTickets = await Ticket.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAgents = await User.countDocuments({ role: 'agent' });

        // Get ticket status distribution
        const statusDistribution = await Ticket.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get ticket priority distribution
        const priorityDistribution = await Ticket.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get department distribution
        const departmentDistribution = await Ticket.aggregate([
            {
                $group: {
                    _id: "$department",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent tickets
        const recentTickets = await Ticket.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user.userId', 'firstName lastName email');

        // Get recent activities
        const recentActivities = await Audit.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('ticket', 'title')
            .populate('performedBy', 'firstName lastName');

        // Get ticket resolution time statistics
        const resolvedTickets = await Ticket.find({ status: 'resolved' });
        const avgResolutionTime = resolvedTickets.reduce((acc, ticket) => {
            const resolutionTime = ticket.updatedAt - ticket.createdAt;
            return acc + resolutionTime;
        }, 0) / (resolvedTickets.length || 1);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalTickets,
                    totalUsers,
                    totalAgents,
                    avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)) // Convert to hours
                },
                distributions: {
                    status: statusDistribution,
                    priority: priorityDistribution,
                    department: departmentDistribution
                },
                recentTickets,
                recentActivities
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
// Get agent performance metrics
export const getAgentPerformance = async (req, res) => {
    try {
        const agentId = req.params.agentId;

        // Get tickets assigned to agent
        const assignedTickets = await Ticket.find({ assignedTo: agentId });
        const resolvedTickets = assignedTickets.filter(ticket => ticket.status === 'resolved');

        // Calculate average resolution time
        const avgResolutionTime = resolvedTickets.reduce((acc, ticket) => {
            const resolutionTime = ticket.updatedAt - ticket.createdAt;
            return acc + resolutionTime;
        }, 0) / (resolvedTickets.length || 1);

        // Get ticket status distribution for this agent
        const statusDistribution = await Ticket.aggregate([
            {
                $match: { assignedTo: agentId }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent activities by this agent
        const recentActivities = await Audit.find({ performedBy: agentId })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('ticket', 'title');

        res.status(200).json({
            success: true,
            data: {
                totalAssigned: assignedTickets.length,
                totalResolved: resolvedTickets.length,
                avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)), // Convert to hours
                statusDistribution,
                recentActivities
            }
        });
    } catch (error) {
        console.error("Error fetching agent performance:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get department performance metrics
export const getDepartmentPerformance = async (req, res) => {
    try {
        const department = req.params.department;

        // Get tickets for department
        const departmentTickets = await Ticket.find({ department });
        const resolvedTickets = departmentTickets.filter(ticket => ticket.status === 'resolved');

        // Calculate average resolution time
        const avgResolutionTime = resolvedTickets.reduce((acc, ticket) => {
            const resolutionTime = ticket.updatedAt - ticket.createdAt;
            return acc + resolutionTime;
        }, 0) / (resolvedTickets.length || 1);

        // Get ticket status distribution
        const statusDistribution = await Ticket.aggregate([
            {
                $match: { department }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get ticket priority distribution
        const priorityDistribution = await Ticket.aggregate([
            {
                $match: { department }
            },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalTickets: departmentTickets.length,
                totalResolved: resolvedTickets.length,
                avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)), // Convert to hours
                statusDistribution,
                priorityDistribution
            }
        });
    } catch (error) {
        console.error("Error fetching department performance:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

