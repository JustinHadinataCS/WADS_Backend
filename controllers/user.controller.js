// FILE: controllers/userController.js
import mongoose from 'mongoose';  // Add this at the top of your file
import User from '../models/user.model.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from 'passport';

// @desc    Check if user exists
// @route   POST /api/users/check
// @access  Public
const checkUserExists = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const userExists = await User.findOne({ email });
  
  res.json({
    exists: !!userExists,
    message: userExists ? 'Email is already registered' : 'Email is available'
  });
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    password, 
    department, 
    timezone, 
    role 
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !phoneNumber || !password || !department || !timezone) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  // Validate password length
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error('Email is already registered. Please use a different email or try logging in.');
  }

  try {
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      department,
      timezone,
      role: role || 'user',
      notificationSettings: {
        email: {
          ticketStatusUpdates: true,
          newAgentResponses: true,
          ticketResolution: true,
          marketingUpdates: false
        },
        inApp: {
          desktopNotifications: true,
          soundNotifications: true
        }
      },
      securitySettings: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        lastPasswordChange: Date.now(),
        passwordStrength: password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak'
      }
    });

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400);
    throw new Error('Error creating user: ' + error.message);
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Get user
  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Update last login timestamp
  user.lastLogin = Date.now();
  await user.save();

  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
});

// The rest of your controller remains the same...

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;
    user.timezone = req.body.timezone || user.timezone;
    user.profilePicture = req.body.profilePicture || user.profilePicture;
    
    // Only admins can change roles
    if (req.user.role === 'admin' && req.body.role) {
      user.role = req.body.role;
    }
    
    // Update notification settings if provided
    if (req.body.notificationSettings) {
      if (req.body.notificationSettings.email) {
        Object.assign(user.notificationSettings.email, req.body.notificationSettings.email);
      }
      if (req.body.notificationSettings.inApp) {
        Object.assign(user.notificationSettings.inApp, req.body.notificationSettings.inApp);
      }
    }
    
    // Update security settings if provided
    if (req.body.securitySettings) {
      Object.assign(user.securitySettings, req.body.securitySettings);
    }
    
    // Change password if provided
    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by pre-validate hook
      user.securitySettings.lastPasswordChange = Date.now();
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Update the password handling in updateUser
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;
    user.timezone = req.body.timezone || user.timezone;
    user.role = req.body.role || user.role;
    user.profilePicture = req.body.profilePicture || user.profilePicture;
    
    // Update notification settings if provided
    if (req.body.notificationSettings) {
      if (req.body.notificationSettings.email) {
        Object.assign(user.notificationSettings.email, req.body.notificationSettings.email);
      }
      if (req.body.notificationSettings.inApp) {
        Object.assign(user.notificationSettings.inApp, req.body.notificationSettings.inApp);
      }
    }
    
    // Update security settings if provided
    if (req.body.securitySettings) {
      Object.assign(user.securitySettings, req.body.securitySettings);
    }

    // Update admin dashboard metrics if provided and user is admin
    if (req.body.adminDashboard && user.role === 'admin') {
      if (req.body.adminDashboard.userStatistics) {
        Object.assign(user.adminDashboard.userStatistics, req.body.adminDashboard.userStatistics);
      }
      if (req.body.adminDashboard.performanceMetrics) {
        Object.assign(user.adminDashboard.performanceMetrics, req.body.adminDashboard.performanceMetrics);
      }
      if (req.body.adminDashboard.agentMetrics) {
        Object.assign(user.adminDashboard.agentMetrics, req.body.adminDashboard.agentMetrics);
      }
      if (req.body.adminDashboard.customerSatisfaction) {
        Object.assign(user.adminDashboard.customerSatisfaction, req.body.adminDashboard.customerSatisfaction);
      }
    }
    
    // Change password if provided
    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by pre-validate hook
      user.securitySettings.lastPasswordChange = Date.now();
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Update security settings
const updateSecuritySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if current user is the user or an admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this user');
  }

  // Update security settings
  if (req.body.twoFactorEnabled !== undefined) {
    user.securitySettings.twoFactorEnabled = req.body.twoFactorEnabled;
  }
  
  if (req.body.twoFactorMethod) {
    user.securitySettings.twoFactorMethod = req.body.twoFactorMethod;
  }

  // Change password if provided
  if (req.body.password) {
    user.password = req.body.password; // Will be hashed by pre-validate hook
    user.securitySettings.lastPasswordChange = Date.now();
  }

  // Update password strength if provided
  if (req.body.passwordStrength) {
    user.securitySettings.passwordStrength = req.body.passwordStrength;
  }

  const updatedUser = await user.save();

  res.json({
    securitySettings: updatedUser.securitySettings
  });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.Did).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user notification settings
// @route   PUT /api/users/:id/notifications
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if current user is the user or an admin
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this user');
  }

  if (req.body.email) {
    Object.assign(user.notificationSettings.email, req.body.email);
  }
  
  if (req.body.inApp) {
    Object.assign(user.notificationSettings.inApp, req.body.inApp);
  }

  const updatedUser = await user.save();

  res.json({
    notificationSettings: updatedUser.notificationSettings
  });
});

// Google OAuth login
const googleLogin = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
};

// Google OAuth callback
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token
    });
  })(req, res, next);
};

// Export all your functions here
export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateNotificationSettings,
  updateSecuritySettings,
  googleLogin,
  googleCallback,
  checkUserExists
};