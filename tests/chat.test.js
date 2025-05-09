import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../server.js';

describe('Chat API', () => {
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

    describe('POST /api/chat', () => {
        it('should return 400 if message is not provided', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Message is required');
        });

        it('should return 200 and AI response for valid message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    message: 'What is the price of the U-life Mobile Cart?'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.response).toBeDefined();
        });
    });
}); 