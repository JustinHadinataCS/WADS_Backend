import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
  name: { type: String, required: true },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] 
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
