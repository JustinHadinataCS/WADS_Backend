import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UserSchema = new Schema({
  firstName: { 
    type: String, 
    required: [true, "Please enter first name"], 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: [true, "Please enter last name"], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, "Please enter email"], 
    unique: true, 
    lowercase: true, 
    trim: true, 
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] 
  },
  phoneNumber: { 
    type: String, 
    required: [true, "Please enter phone number"], 
    trim: true 
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  department: { 
    type: String, 
    required: [true, "Please enter department"], 
    trim: true 
  },
  timezone: { 
    type: String, 
    required: [true, "Please enter timezone"], 
    trim: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'agent', 'admin'], 
    default: 'user' 
  },
  profilePicture: String,
  notificationSettings: {
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
  },
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { 
      type: String, 
      enum: ['authenticator', 'sms', null], 
      default: null 
    },
    lastPasswordChange: { 
      type: Date, 
      default: Date.now 
    },
    passwordStrength: { 
      type: String, 
      enum: ['weak', 'medium', 'strong'], 
      default: 'medium' 
    }
  },
  // Admin Dashboard Metrics
  adminDashboard: {
    userStatistics: {
      totalUsers: { type: Number, default: 0 },
      activeToday: { type: Number, default: 0 },
      newUsers: { type: Number, default: 0 },
      totalAgents: { type: Number, default: 0 }
    },
    performanceMetrics: {
      totalTickets: { type: Number, default: 0 },
      ticketsInProgress: { type: Number, default: 0 },
      ticketsPending: { type: Number, default: 0 },
      ticketsResolved: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 }, // in minutes
      escalationRate: { type: Number, default: 0 } // percentage
    },
    agentMetrics: {
      totalAgents: { type: Number, default: 0 },
      categoryDistribution: {
        category1: { type: Number, default: 0 },
        category2: { type: Number, default: 0 },
        category3: { type: Number, default: 0 }
      }
    },
    customerSatisfaction: {
      totalResponses: { type: Number, default: 0 },
      distribution: {
        positive: {
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 }
        },
        neutral: {
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 }
        },
        negative: {
          count: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 }
        }
      }
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('Password not found for user');
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error in comparePassword:', error);
    throw error;
  }
};

// Update the updatedAt field on update
UserSchema.pre('findOneAndUpdate', function(next) {
  this._update.updatedAt = Date.now();
  next();
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('matchPassword called:', {
      hasPassword: !!this.password,
      passwordLength: this.password?.length,
      enteredPasswordLength: enteredPassword?.length
    });

    if (!this.password) {
      console.log('No password found for user');
      throw new Error('Password not found for user');
    }

    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error in matchPassword:', error);
    throw error;
  }
};

// Create the model
const User = mongoose.model('User', UserSchema);

// Export the model
export default User;