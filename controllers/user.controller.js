// FILE: controllers/userController.js
import User from '../models/user.model.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, department, timezone, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phoneNumber,
    passwordHash: password, 
    department,
    timezone: timezone || null,
    role: role || 'user'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

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
      user.passwordHash = req.body.password;
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

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-passwordHash');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
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
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
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
      user.passwordHash = req.body.password;
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

// @desc    Update user security settings
// @route   PUT /api/users/:id/security
// @access  Private
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
    user.passwordHash = req.body.password;
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
};