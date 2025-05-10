import mongoose from "mongoose";

const responseTimeSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  durationMs: { type: Number, required: true }
});

const responseTime = mongoose.model('ServerMetric', responseTimeSchema);

export default responseTime
