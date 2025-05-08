import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js'; 
import Audit from '../models/audit.model.js';
import User from '../models/user.model.js';
import Ticket from '../models/ticket.model.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Audit.deleteMany({});
});

describe('Audit Log Routes', () => {
  it('should return recent audit logs (max 10)', async () => {
    const user = await User.create({ name: 'Admin' });
    const ticket = await Ticket.create({ subject: 'Sample Ticket' });

    for (let i = 0; i < 12; i++) {
      await Audit.create({
        ticket: ticket._id,
        action: 'updated',
        fieldChanged: 'status',
        previousValue: 'open',
        newValue: 'closed',
        performedBy: user._id,
      });
    }

    const res = await request(app).get('/api/audit/recent');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  it('should return paginated audit logs', async () => {
    const user = await User.create({ name: 'Admin' });
    const ticket = await Ticket.create({ subject: 'Sample Ticket' });

    for (let i = 0; i < 25; i++) {
      await Audit.create({
        ticket: ticket._id,
        action: 'comment_added',
        performedBy: user._id,
      });
    }

    const res = await request(app).get('/api/audit?page=2&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(10);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.pages).toBe(3);
  });
});
