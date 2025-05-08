import mongoose from "mongoose";
const { Schema } = mongoose;

const AuditSchema = new Schema({
  ticket: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created',
      'updated',
      'deleted',
      'status_changed',
      'priority_changed',
      'assigned',
      'comment_added',
      'attachment_added',
      'feedback_submitted'
    ]
  },
  fieldChanged: {
    type: String,
    required: false, // Not all actions need a field change (e.g., comment_added)
  },
  previousValue: {
    type: Schema.Types.Mixed
  },
  newValue: {
    type: Schema.Types.Mixed
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
},{
    timestamps: true
});

const Audit = mongoose.model('Audit', AuditSchema);

export default Audit;
