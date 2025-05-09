import { expect } from 'chai';
import { db, auth } from '../config/firebase.js';

describe('Firebase Configuration Tests', () => {
    it('should have all required environment variables', () => {
        expect(process.env.FIREBASE_API_KEY).to.exist;
        expect(process.env.FIREBASE_AUTH_DOMAIN).to.exist;
        expect(process.env.FIREBASE_PROJECT_ID).to.exist;
        expect(process.env.FIREBASE_STORAGE_BUCKET).to.exist;
        expect(process.env.FIREBASE_MESSAGING_SENDER_ID).to.exist;
        expect(process.env.FIREBASE_APP_ID).to.exist;
        expect(process.env.FIREBASE_MEASUREMENT_ID).to.exist;
    });

    it('should initialize Firebase services', () => {
        expect(db).to.exist;
        expect(auth).to.exist;
    });

    it('should have correct project ID', () => {
        expect(process.env.FIREBASE_PROJECT_ID).to.equal('semestamedikaapp');
    });
}); 