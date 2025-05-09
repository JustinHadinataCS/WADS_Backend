import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/user.model.js';
import Ticket from '../models/ticket.model.js';
import Counter from '../models/counter.model.js';

let mongoServer;
let userToken;
let agentToken;
let testUser;
let testAgent;

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
  await User.deleteMany({});
  await Ticket.deleteMany({});
  await Counter.deleteMany({});

  // Create test user
  testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    password: 'password123',
    department: 'Radiology',
    timezone: 'UTC'
  };

  // Create test agent
  testAgent = {
    firstName: 'Test',
    lastName: 'Agent',
    email: 'agent@example.com',
    phoneNumber: '0987654321',
    password: 'password123',
    department: 'Radiology',
    timezone: 'UTC',
    role: 'agent'
  };

  // Register and login user
  const userRes = await request(app)
    .post('/api/users')
    .send(testUser);
  userToken = userRes.body.token;

  // Register and login agent
  const agentRes = await request(app)
    .post('/api/users')
    .send(testAgent);
  agentToken = agentRes.body.token;
});

describe('Ticket Tests', () => {
  const testTicket = {
    title: 'Test Ticket',
    description: 'This is a test ticket',
    department: 'Radiology',
    category: 'Software Problem',
    priority: 'medium'
  };

  describe('Create Ticket', () => {
    it('should create a new ticket successfully', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testTicket);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testTicket.title);
      expect(res.body.data.assignedTo).toBeDefined();
    });

    it('should not create ticket without required fields', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not create ticket without authentication', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send(testTicket);

      expect(res.status).toBe(401);
    });
  });

  describe('Get Tickets', () => {
    beforeEach(async () => {
      // Create multiple test tickets
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testTicket);

      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testTicket,
          title: 'Test Ticket 2'
        });
    });

    it('should get all tickets for the user', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should get a specific ticket by ID', async () => {
      // First create a ticket
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testTicket);

      const ticketId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(ticketId);
    });

    it('should not get ticket with invalid ID', async () => {
      const res = await request(app)
        .get('/api/tickets/507f1f77bcf86cd799439011')  // Using a valid MongoDB ObjectId format but non-existent
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Ticket not found");
    });
  });

  describe('Search and Filter Tickets', () => {
    beforeEach(async () => {
      // Create tickets with different properties
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testTicket,
          title: 'Network Issue Ticket',
          category: 'Network Issue',
          priority: 'high'
        });

      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testTicket,
          title: 'Software Problem Ticket',
          category: 'Software Problem',
          priority: 'medium'
        });
    });

    it('should search tickets by keyword', async () => {
      const res = await request(app)
        .get('/api/tickets/search?keyword=Network')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Network');
    });

    it('should filter tickets by category', async () => {
      const res = await request(app)
        .get('/api/tickets/search?category=Software Problem')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Software Problem');
    });

    it('should filter tickets by priority', async () => {
      const res = await request(app)
        .get('/api/tickets/search?priority=high')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('high');
    });
  });

  describe('Update Ticket', () => {
    let ticketId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testTicket);

      ticketId = createRes.body.data._id;
    });

    it('should update ticket successfully', async () => {
      const updateData = {
        title: 'Updated Ticket Title',
        priority: 'high'
      };

      const res = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.priority).toBe(updateData.priority);
    });

    it('should not update ticket with invalid ID', async () => {
      const res = await request(app)
        .put('/api/tickets/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });
  });

  describe('Delete Ticket', () => {
    let ticketId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testTicket);

      ticketId = createRes.body.data._id;
    });

    it('should delete ticket successfully', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify ticket is deleted
      const getRes = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should not delete ticket with invalid ID', async () => {
      const res = await request(app)
        .delete('/api/tickets/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});
