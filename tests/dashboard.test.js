import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/user.model.js';
import Ticket from '../models/ticket.model.js';
import Feedback from '../models/feedback.model.js';
import Audit from '../models/audit.model.js';
import responseTime from '../models/responseTime.model.js';

let mongoServer;
let adminToken;
let agentToken;
let userToken;

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections
  await User.deleteMany({});
  await Ticket.deleteMany({});
  await Feedback.deleteMany({});
  await Audit.deleteMany({});
  await responseTime.deleteMany({});

  // Create test users for different roles
  const adminUser = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    department: 'Radiology',
    timezone: 'UTC',
    phoneNumber: '1234567890'
  });

  const agentUser = await User.create({
    firstName: 'Agent',
    lastName: 'User',
    email: 'agent@test.com',
    password: 'password123',
    role: 'agent',
    department: 'Radiology',
    timezone: 'UTC',
    phoneNumber: '2345678901'
  });

  const regularUser = await User.create({
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
    department: 'Radiology',
    timezone: 'UTC',
    phoneNumber: '3456789012'
  });

  // Login and get tokens
  const adminLogin = await request(app)
    .post('/api/users/login')
    .send({ email: 'admin@test.com', password: 'password123' });
  adminToken = adminLogin.body.token;

  const agentLogin = await request(app)
    .post('/api/users/login')
    .send({ email: 'agent@test.com', password: 'password123' });
  agentToken = agentLogin.body.token;

  const userLogin = await request(app)
    .post('/api/users/login')
    .send({ email: 'user@test.com', password: 'password123' });
  userToken = userLogin.body.token;

  // Create some test data
  const testTicket = await Ticket.create({
    title: 'Test Ticket 1',
    description: 'Test Description',
    status: 'pending',
    priority: 'high',
    department: 'Radiology',
    category: 'Equipment Issue',
    equipment: {
      name: 'MRI Scanner 1',
      type: 'MRI Scanner'
    },
    user: {
      userId: regularUser._id,
      firstName: regularUser.firstName,
      lastName: regularUser.lastName,
      email: regularUser.email
    },
    assignedTo: agentUser._id,
    activityLog: [{
      action: 'created',
      performedBy: regularUser._id,
      timestamp: new Date()
    }]
  });

  await Feedback.create({
    rating: 'positive',
    ticket: testTicket._id,
    createdBy: regularUser._id,
    agent: agentUser._id
  });

  await Audit.create({
    ticket: testTicket._id,
    action: 'created',
    performedBy: regularUser._id,
    fieldChanged: 'status',
    previousValue: null,
    newValue: 'pending'
  });

  await responseTime.create({
    timestamp: new Date(),
    durationMs: 100
  });
});

describe('Dashboard Tests', () => {
  describe('Admin Dashboard', () => {
    it('should get ticket overview', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('inProgress');
      expect(res.body).toHaveProperty('resolved');
    });

    it('should get user statistics', async () => {
      const res = await request(app)
        .get('/api/dashboard/user-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('activeToday');
      expect(res.body).toHaveProperty('newUsers');
      expect(res.body).toHaveProperty('totalAgents');
    });

    it('should get customer satisfaction metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard/customer-satisfaction')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('positive');
      expect(res.body).toHaveProperty('neutral');
      expect(res.body).toHaveProperty('negative');
    });

    it('should get recent activity', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('activities');
      expect(Array.isArray(res.body.activities)).toBe(true);
    });

    it('should get server response time metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard/response-time')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('interval');
        expect(res.body[0]).toHaveProperty('avgResponseTimeMs');
        expect(res.body[0]).toHaveProperty('count');
      }
    });
  });

  describe('Agent Dashboard', () => {
    it('should get agent dashboard stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/agent-stats')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAssigned');
      expect(res.body).toHaveProperty('resolvedThisWeek');
      expect(res.body).toHaveProperty('feedbackStats');
    });

    it('should get recent agent tickets', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-agent-ticket')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recentTickets');
      expect(Array.isArray(res.body.recentTickets)).toBe(true);
    });

    it('should get agent ticket status', async () => {
      const res = await request(app)
        .get('/api/dashboard/agent/ticket-status')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('in_progress');
      expect(res.body).toHaveProperty('resolved');
    });
  });

  describe('User Dashboard', () => {
    it('should get recent user tickets', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-user-ticket')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recentTickets');
      expect(Array.isArray(res.body.recentTickets)).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    it('should not allow user to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(401);
    });``

    it('should not allow agent to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(401);
    });

    it('should not allow admin to access agent-specific endpoints', async () => {
      const res = await request(app)
        .get('/api/dashboard/agent-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(401);
    });

    it('should not allow agent to access user-specific endpoints', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-user-ticket')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(401);
    });
  });
}); 