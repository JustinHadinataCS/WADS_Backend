import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    receiver: { type: Schema.Types.ObjectId, ref: "User", default: null },
    roomId: { type: String, default: null },
    type: { type: String, enum: ["public", "private"], required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
