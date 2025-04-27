import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['system', 'ticket', 'message', 'feedback'], default: 'system' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    link: { type: String, default: '' },
},  { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
