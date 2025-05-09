import mongoose from "mongoose";
import Audit from "./audit.model.js";
import User from './user.model.js'; 
const { Schema } = mongoose;

const TicketSchema = new Schema({
    title: { 
        type: String, 
        required: [true, "Please enter ticket title"],
        trim: true
    },
    description: { 
        type: String, 
        required: [true, "Please enter ticket description"],
        trim: true
    },
    user: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        firstName: String,
        lastName: String,
        email: String
    },
    assignedTo: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',  // TODO: Replace with actual User model reference
        validate: {
            validator: async function(value) {
                if (!value) return true;
                const user = await User.findById(value); 
                if (!user) return false;  // or throw a custom error message
                return user.role === 'agent';
            },
            message: 'Assigned user must exist and have the "agent" role'
        }        
    },
    department: {
        type: String,
        required: true,
        trim: true,
        enum: ['Radiology', 'Cardiology', 'Emergency', 'Laboratory', 'Pharmacy', 'Other']
    },
    category: { 
        type: String,
        required: true,
        enum: [
            'Equipment Issue',
            'MRI Machine Calibration',
            'Software Problem',
            'Network Issue',
            'Access Request',
            'General Inquiry',
            'Maintenance Request',
            'Training Request',
            'Other'
        ]
    },
    equipment: {
        name: { 
            type: String,
            required: function() { return this.category === 'Equipment Issue' }
        },
        type: { 
            type: String,
            enum: ['MRI Scanner', 'CT Scanner', 'X-Ray', 'Ultrasound', 'Other'],
            required: function() { return this.category === 'Equipment Issue' }
        }
    },
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'resolved'], 
        default: 'pending' 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'], 
        default: 'medium',
        required: true
    },
    activityLog: [{
        action: { type: String, enum: ['created', 'updated', 'status_changed', 'assigned', 'comment_added', 'attachment_added'] },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        previousValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }],
    communications: [{
        message: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderType: { type: String, enum: ['Support Agent', 'User'], required: true },
        attachments: [{ fileName: String, fileUrl: String, uploadedAt: { type: Date, default: Date.now } }],
        timestamp: { type: Date, default: Date.now }
    }],
    attachments: [{
        fileName: { type: String, required: true },
        fileUrl: String,
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Add audit logging middleware
TicketSchema.pre('findOneAndUpdate', async function (next) {
    try {
      const update = this.getUpdate();
      const options = this.getOptions();
      const userId = options.context?.user?._id; // requires user to be passed in options.context
  
      if (!userId) return next(); // Skip if no user info (shouldn't happen if secure)
  
      const ticketBefore = await this.model.findOne(this.getQuery()).lean();
  
      const auditEntries = [];
  
      // Fields to audit
      const fieldsToAudit = ['status', 'priority', 'assignedTo', 'title', 'description'];
  
      for (let field of fieldsToAudit) {
        if (update[field] !== undefined && update[field] !== ticketBefore[field]) {
          auditEntries.push({
            ticket: ticketBefore._id,
            action: `${field}_changed`,
            fieldChanged: field,
            previousValue: ticketBefore[field],
            newValue: update[field],
            performedBy: userId
          });
        }
      }
  
      if (auditEntries.length > 0) {
        await Audit.insertMany(auditEntries);
      }
  
      next();
    } catch (err) {
      console.error('Audit logging failed:', err);
      next(); // Never block ticket update
    }
});

const Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;
