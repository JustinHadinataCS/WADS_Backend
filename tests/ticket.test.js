import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/user.model.js';
import Ticket from '../models/ticket.model.js';
import Counter from '../models/counter.model.js';

let mongoServer;

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
  // Clear any previous data
  await Ticket.deleteMany({});
  await User.deleteMany({});
  await Counter.deleteMany({});
});

describe('Ticket Management Tests', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    "phoneNumber": "0987654321",
    "password": "AgentPass456!",
    "department": "Technical",
    "timezone": "GMT+8",
    role: 'user',
  };

  let agentToken;
  let userToken;

  beforeEach(async () => {
    // Create a user for login testing
    const user = new User(testUser);
    await user.save();
    const res = await request(app).post('/api/users/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    userToken = res.body.token;

    // Create an agent for ticket assignment testing
    const agent = new User({
      ...testUser,
      role: 'agent',
      email: 'agent@example.com',
    });
    await agent.save();
  });

  describe('Create Ticket', () => {
    it('should create a ticket successfully', async () => {
      const newTicket = {
        "title": "TESTING",
        "description": "testsetsetsetsetsetsetestsetsetset",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTicket);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title).toBe(newTicket.title);
    });

    it('should not create a ticket with missing required fields', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Incomplete Ticket',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Please provide all required fields');
    });
  });

  describe('Get Tickets', () => {
    it('should get all tickets', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      await new Ticket(ticketData).save();

      const res = await request(app).get('/api/tickets');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get a single ticket by ID', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      const ticket = await new Ticket(ticketData).save();

      const res = await request(app).get(`/api/tickets/${ticket._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(ticketData.title);
    });

    it('should return 404 for non-existing ticket', async () => {
      const res = await request(app).get('/api/tickets/invalidTicketId');
      expect(res.status).toBe(404);
    });
  });

  describe('Search and Filter Tickets', () => {
    it('should search tickets by keyword', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      await new Ticket(ticketData).save();

      const res = await request(app)
        .get('/api/tickets/search')
        .query({ keyword: 'searchable' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter tickets by department', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      await new Ticket(ticketData).save();

      const res = await request(app)
        .get('/api/tickets/search')
        .query({ keyword: 'Radiology' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Update Ticket', () => {
    it('should update an existing ticket', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      const ticket = await new Ticket(ticketData).save();

      const updatedData = { description: 'Updated description' };

      const res = await request(app)
        .put(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe(updatedData.description);
    });

    it('should return 404 for non-existing ticket', async () => {
      const res = await request(app)
        .put('/api/tickets/invalidTicketId')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(404);
    });
  });

  describe('Delete Ticket', () => {
    it('should delete an existing ticket', async () => {
      const ticketData = {
        "title": "a4",
        "description": "The machine is making strange noises",
        "department": "Radiology",
        "category": "Equipment Issue",
        "priority": "high",
        "userId": "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
      
        // Only required if category is "Equipment Issue"
        "equipment": {
          "name": "MRI Scanner Model X",
          "type": "MRI Scanner"
        }
      };

      const ticket = await new Ticket(ticketData).save();

      const res = await request(app)
        .delete(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Ticket deleted');
    });

    it('should return 404 for non-existing ticket', async () => {
      const res = await request(app)
        .delete('/api/tickets/invalidTicketId')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});
