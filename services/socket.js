import Message from "../models/Message.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`🟢 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on("publicMessage", async ({ userId, content, roomId }) => {
      try {
        if (!userId || !content || !roomId) {
          return socket.emit("errorMessage", "Missing required fields.");
        }

        const message = await Message.create({
          userId,
          content,
          roomId,
          type: "public",
        });

        io.to(roomId).emit("newPublicMessage", message);
      } catch (err) {
        console.error("Error sending public message:", err.message);
        socket.emit("errorMessage", "Server error while sending message.");
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
