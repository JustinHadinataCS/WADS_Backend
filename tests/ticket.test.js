import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import Ticket from '../models/ticket.model.js';
import User from '../models/user.model.js';

let mongoServer;
let testUser;
let testTicket;
let authToken;

// Set up test environment
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
  // Clear the database before each test
  await Ticket.deleteMany({});
  await User.deleteMany({});

  // Create a test user
  testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    password: 'password123',
    department: 'IT',
    timezone: 'UTC'
  };

  // Register the test user
  const registerResponse = await request(app)
    .post('/api/users')
    .send(testUser);

  authToken = registerResponse.body.token;

  // Create a test ticket
  testTicket = {
    title: 'Test Ticket',
    description: 'This is a test ticket description',
    department: 'IT',
    category: 'General Inquiry',
    priority: 'medium',
    status: 'open'
  };
});

describe('Ticket API Tests', () => {
  describe('Create Ticket', () => {
    it('should create a new ticket successfully', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(testTicket.title);
      expect(response.body.status).toBe('open');
    });

    it('should not create a ticket without required fields', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not create a ticket with invalid priority', async () => {
      const invalidTicket = {
        ...testTicket,
        priority: 'invalid_priority'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTicket);

      expect(response.status).toBe(400);
    });
  });

  describe('Get Tickets', () => {
    it('should get all tickets for a user', async () => {
      // Create a ticket first
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a specific ticket by ID', async () => {
      // Create a ticket first
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      const ticketId = createResponse.body._id;

      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(ticketId);
    });
  });

  describe('Update Ticket', () => {
    it('should update a ticket successfully', async () => {
      // Create a ticket first
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      const ticketId = createResponse.body._id;

      const updateData = {
        title: 'Updated Ticket Title',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should not update a ticket with invalid status', async () => {
      // Create a ticket first
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      const ticketId = createResponse.body._id;

      const updateData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });
  });

  describe('Delete Ticket', () => {
    it('should delete a ticket successfully', async () => {
      // Create a ticket first
      const createResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTicket);

      const ticketId = createResponse.body._id;

      const response = await request(app)
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify ticket is deleted
      const getResponse = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});