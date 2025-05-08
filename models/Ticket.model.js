import mongoose from "mongoose";
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
        enum: ['open', 'pending', 'in_progress', 'resolved', 'closed'], 
        default: 'open' 
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
    }],
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        submittedAt: Date,
        submittedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
}, {
    timestamps: true
});

const Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;
