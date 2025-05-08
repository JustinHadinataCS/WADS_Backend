import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js'; // your Express app instance
import Notification from '../models/notification.model.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Notification.deleteMany();
});

describe('Notification API', () => {
  it('should create a new notification', async () => {
    const res = await request(app).post('/api/notifications').send({
      userId: new mongoose.Types.ObjectId(),
      title: 'Test Notification',
      content: 'This is a test.',
      type: 'system',
      priority: 'high',
      link: '/some/path'
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('notification');
    expect(res.body.notification.title).toBe('Test Notification');
  });

  it('should fetch all notifications for a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    await Notification.create([
      { userId, title: 'A', content: 'A content' },
      { userId, title: 'B', content: 'B content' }
    ]);

    const res = await request(app).get(`/api/notifications/users/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should mark a notification as read', async () => {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(),
      title: 'To Be Read',
      content: 'Some content',
    });

    const res = await request(app).put(`/api/notifications/${notification._id}/read`);
    expect(res.statusCode).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  it('should delete a notification', async () => {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(),
      title: 'To Delete',
      content: 'Delete this'
    });

    const res = await request(app).delete(`/api/notifications/${notification._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });

  it('should get a notification by ID', async () => {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(),
      title: 'Single Notification',
      content: 'Testing fetch by ID'
    });
  
    const res = await request(app).get(`/api/notifications/${notification._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Single Notification');
  });

  it('should get all notifications (admin)', async () => {
    await Notification.create([
      {
        userId: new mongoose.Types.ObjectId(),
        title: 'Notif A',
        content: 'A content'
      },
      {
        userId: new mongoose.Types.ObjectId(),
        title: 'Notif B',
        content: 'B content'
      }
    ]);
  
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
  
});
