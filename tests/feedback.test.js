import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/user.model.js';
import Ticket from '../models/ticket.model.js';
import Room from '../models/room.model.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let adminToken;
let agentToken;
let userToken;
let testUser;
let testAgent;
let testTicket;
let roomId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Ticket.deleteMany({}),
    Room.deleteMany({})
  ]);

  // Create test room
  const room = await Room.create({
    name: 'Test Room',
    capacity: 10,
    status: 'active'
  });
  roomId = room._id;

  // Create test users
  testUser = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    department: 'IT',
    timezone: 'UTC'
  });

  testAgent = await User.create({
    firstName: 'Test',
    lastName: 'Agent',
    email: 'agent@example.com',
    password: 'password123',
    role: 'agent',
    department: 'IT',
    timezone: 'UTC'
  });

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    department: 'IT',
    timezone: 'UTC'
  });

  // Generate tokens
  userToken = jwt.sign(
    { id: testUser._id, role: 'user' },
    process.env.JWT_SECRET || 'test-jwt-secret'
  );

  agentToken = jwt.sign(
    { id: testAgent._id, role: 'agent' },
    process.env.JWT_SECRET || 'test-jwt-secret'
  );

  adminToken = jwt.sign(
    { id: admin._id, role: 'admin' },
    process.env.JWT_SECRET || 'test-jwt-secret'
  );

  // Create test ticket
  const ticketData = {
    title: 'Test Ticket',
    description: 'This is a test ticket',
    category: 'Software Problem',
    priority: 'high',
    department: 'IT',
    equipment: {
      name: 'Test Equipment',
      type: 'Computer'
    },
    roomId: roomId,
    user: {
      userId: testUser._id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email
    },
    assignedTo: {
      userId: testAgent._id,
      firstName: testAgent.firstName,
      lastName: testAgent.lastName,
      email: testAgent.email
    },
    status: 'resolved'  // Set initial status to resolved
  };

  const ticketRes = await request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${userToken}`)
    .send(ticketData);

  testTicket = ticketRes.body.data;

  // Update ticket status to resolved and wait for it to complete
  const updateRes = await request(app)
    .put(`/api/tickets/${testTicket._id}/status`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'resolved' });

  // Verify the ticket is resolved
  const verifyRes = await request(app)
    .get(`/api/tickets/${testTicket._id}`)
    .set('Authorization', `Bearer ${userToken}`);

  if (verifyRes.body.data.status !== 'resolved') {
    throw new Error('Failed to resolve ticket for feedback tests');
  }

  // Wait for the ticket status update to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});

describe('Feedback Tests', () => {
  describe('Create Feedback', () => {
    it('should create feedback successfully', async () => {
      // Verify ticket is resolved before creating feedback
      const ticketRes = await request(app)
        .get(`/api/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(ticketRes.body.data.status).toBe('resolved');

      const res = await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('rating', 'positive');
      expect(res.body).toHaveProperty('ticket');
      expect(res.body).toHaveProperty('createdBy');
      expect(res.body).toHaveProperty('agent');
    });

    it('should not create feedback without authentication', async () => {
      const res = await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .send({
          rating: 'positive'
        });

      expect(res.status).toBe(401);
    });

    it('should not create feedback for non-existent ticket', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/feedback/tickets/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });

      expect(res.status).toBe(404);
    });

    it('should not create duplicate feedback for same ticket', async () => {
      // Verify ticket is resolved before creating feedback
      const ticketRes = await request(app)
        .get(`/api/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(ticketRes.body.data.status).toBe('resolved');

      // Create first feedback
      await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });

      // Try to create second feedback
      const res = await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Feedback already submitted for this ticket");
    });
  });

  describe('Get Feedback for Ticket', () => {
    beforeEach(async () => {
      // Verify ticket is resolved before creating feedback
      const ticketRes = await request(app)
        .get(`/api/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(ticketRes.body.data.status).toBe('resolved');

      // Create feedback for the test ticket
      await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });
    });

    it('should get feedback for ticket successfully', async () => {
      const res = await request(app)
        .get(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rating', 'positive');
      expect(res.body).toHaveProperty('ticket');
      expect(res.body).toHaveProperty('createdBy');
      expect(res.body).toHaveProperty('agent');
    });

    it('should not get feedback without authentication', async () => {
      const res = await request(app)
        .get(`/api/feedback/tickets/${testTicket._id}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent feedback', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/feedback/tickets/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Get Agent Feedback Summary', () => {
    beforeEach(async () => {
      // Verify ticket is resolved before creating feedback
      const ticketRes = await request(app)
        .get(`/api/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(ticketRes.body.data.status).toBe('resolved');

      // Create multiple feedback entries for the agent
      await request(app)
        .post(`/api/feedback/tickets/${testTicket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 'positive'
        });
    });

    it('should get agent feedback summary successfully', async () => {
      const res = await request(app)
        .get(`/api/feedback/agents/${testAgent._id}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('positive');
      expect(res.body).toHaveProperty('neutral');
      expect(res.body).toHaveProperty('negative');
    });

    it('should not get agent feedback summary without authentication', async () => {
      const res = await request(app)
        .get(`/api/feedback/agents/${testAgent._id}`);

      expect(res.status).toBe(401);
    });

    it('should not get agent feedback summary without agent role', async () => {
      const res = await request(app)
        .get(`/api/feedback/agents/${testAgent._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(401);
    });
  });
});
