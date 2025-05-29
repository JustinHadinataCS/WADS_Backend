import Message from "../models/message.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`Agent Connected: ${socket.id}`);

    // Join room
    socket.on("forum:join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle message
    socket.on("forum:send-message", async ({ message, roomId }) => {
      try {
        const currentUser = await User.findById(socket.user._id); // Ensure the socket has the user's info
        if (!currentUser) {
          console.error("User not found");
          return;
        }

        // Create a new message with the correct structure
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

        // Save to DB
        await newMessage.save();

        // Emit to room
        io.to(roomId).emit("forum:message-received", {
          content: newMessage.content,
          roomId: newMessage.roomId,
          user: newMessage.user,
          createdAt: newMessage.createdAt,
        });

        console.log(`Message sent to ${roomId}: ${message}`);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Agent Disconnected: ${socket.id}`);
    });
  });
}
