import Message from "../models/message.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Public chat
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("publicMessage", async ({ userId, content, roomId }) => {
      const message = await Message.create({
        userId,
        content,
        roomId,
        type: "public",
      });

      io.to(roomId).emit("newPublicMessage", message);
    });

    // Cleanup
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}
