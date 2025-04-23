import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: {
        ticketStatusUpdates: { type: Boolean, default: true },
        newAgentResponses: { type: Boolean, default: true },
        ticketResolution: { type: Boolean, default: true },
        marketingUpdates: { type: Boolean, default: false }
    },
    inApp: {
        desktopNotifications: { type: Boolean, default: true },
        soundNotifications: { type: Boolean, default: true }
    }
});

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
