import Message from "../models/message.model.js";
import Ticket from "../models/ticket.model.js";
import User from "../models/user.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id} (User ID: ${socket.user?._id || 'anonymous'})`);
    
    // Join normal chat room
    socket.on("forum:join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle normal messages
    socket.on("forum:send-message", async ({ message, roomId }) => {
      try {
        const currentUser = await User.findById(socket.user._id);
        if (!currentUser) {
          console.error("User not found");
          return;
        }

        const newMessage = new Message({
          content: message,
          roomId,
          user: {
            userId: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
          },
        });

        await newMessage.save();
        io.to(roomId).emit("forum:message-received", newMessage);
        console.log(`Message sent to ${roomId}`);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // Ticket Messaging
    
    // Join ticket room
    socket.on("ticket:join", async (ticketId) => {
      try {
        const userId = socket.user?._id;
        if (!userId) {
          console.error("Unauthorized: No user ID");
          return;
        }

        const ticket = await Ticket.findOne({
          _id: ticketId,
          $or: [
            { 'user.userId': userId },
            { 'assignedTo.userId': userId },
            { 'participants.userId': userId }
          ]
        });

        if (!ticket) {
          console.error(`User ${userId} not authorized for ticket ${ticketId}`);
          return;
        }

        socket.join(`ticket-${ticketId}`);
        console.log(`User ${userId} joined ticket room ${ticketId}`);
      } catch (error) {
        console.error("Error joining ticket room:", error);
      }
    });

    // Handle ticket messages
    socket.on("ticket:message", async ({ ticketId, message, attachments = [] }) => {
      try {
        const userId = socket.user?._id;
        if (!userId) {
          console.error("Unauthorized: No user ID");
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          console.error("User not found");
          return;
        }

        const ticket = await Ticket.findOne({
          _id: ticketId,
          $or: [
            { 'user.userId': userId },
            { 'assignedTo.userId': userId },
            { 'participants.userId': userId }
          ]
        });

        if (!ticket) {
          console.error(`User ${userId} not authorized for ticket ${ticketId}`);
          return;
        }

        // Add user to participants if not already there
        const isParticipant = ticket.participants.some(p => p.userId.equals(userId));
        if (!isParticipant) {
          ticket.participants.push({
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          });
        }

        const newMessage = {
          content: message,
          sender: {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          },
          attachments,
          createdAt: new Date()
        };

        ticket.messages.push(newMessage);
        await ticket.save();

        io.to(`ticket-${ticketId}`).emit("ticket:message", newMessage);
        console.log(`Ticket message sent to ${ticketId}`);
      } catch (error) {
        console.error("Error handling ticket message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}