import mongoose from 'mongoose';

const uptimeLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['up', 'down'], required: true },
  message: { type: String }
});

const uptimeLog = mongoose.model('UptimeLog', uptimeLogSchema);
export default uptimeLog;
