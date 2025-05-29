import Message from "../models/message.model.js";
import User from '../models/user.model.js';
import Room from "../models/room.model.js";
import mongoose from "mongoose";

export const getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user._id;

    // Agent group
    if (roomId === 'agents-room') {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: "Only agents can access this room" });
      }

      // Fetch messages tagged with 'agents-room'
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const messages = await Message.find({ roomId: 'agents-room' })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      return res.status(200).json(messages);
    }

    // Handle regular room IDs: Validate ObjectId for non-special rooms
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room || !room.users.includes(currentUserId)) {
      return res.status(403).json({ message: "You are not part of this room" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ roomId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createMessage = async (req, res) => {
  const currentUserId = req.user._id;
  const { roomId } = req.params;
  const { message } = req.body;
  const io = req.app.get('io');

  if (!roomId || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  let allowed = false;

  if (roomId === 'agents-room') {
    allowed = req.user.role === 'agent';
  } else {
    const room = await Room.findById(roomId);
    allowed = room?.users.includes(currentUserId);
  }

  if (!allowed) {
    return res.status(403).json({ message: "You are not part of this room" });
  }

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
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

  try {
    await newMessage.save();
    io.to(roomId).emit('new-message', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createRoom = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const { otherUserEmail } = req.body;

    if (!currentUserId || !otherUserEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const otherUser = await User.findOne({ email: otherUserEmail });
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing room
    const existingRoom = await Room.findOne({
      users: { $all: [currentUserId, otherUser._id], $size: 2 },
    });

    if (existingRoom) {
      return res.json({ roomId: existingRoom._id, message: "Room already exists" });
    }

    const newRoom = new Room({
      users: [currentUserId, otherUser._id],
      name: `Room between ${req.user.firstName} and ${otherUser.firstName}`,
    });

    await newRoom.save();

    await User.updateOne({ _id: currentUserId }, { $push: { rooms: newRoom._id } });
    await User.updateOne({ _id: otherUser._id }, { $push: { rooms: newRoom._id } });

    res.json({ roomId: newRoom._id });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserRoom = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    console.log("Fetching rooms for User ID:", currentUserId);

    const currentUser = await User.findById(currentUserId).populate('rooms');
    console.log("Fetched User with populated rooms:", currentUser);

    if (!currentUser) {
      console.log("User not found.");
      return res.status(404).json({ message: "User not found" });
    }

    // Return empty array if user has no rooms
    const rooms = currentUser.rooms || [];
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const agentRoom = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!currentUser || currentUser.role !== 'agent') {
      return res.status(403).json({ message: "Only agents can access this room" });
    }

    res.json({ roomId: "agents-room" });
  } catch (error) {
    console.error("Error generating agents room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
