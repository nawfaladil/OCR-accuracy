import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../server';
import { query, initDatabase, closePool } from '../db/connection';
import bcrypt from 'bcrypt';

describe('Settings API', () => {
  let authCookies: string[];

  beforeAll(async () => {
    // Initialize database
    await initDatabase();
    
    // Create a test user
    const passwordHash = await bcrypt.hash('testpassword', 10);
    await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      ['testuser', passwordHash]
    );

    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpassword' });
    
    authCookies = (Array.isArray(loginResponse.headers['set-cookie']) 
      ? loginResponse.headers['set-cookie'] 
      : [loginResponse.headers['set-cookie']]).filter(Boolean) as string[];
  });

  afterAll(async () => {
    // Clean up test user
    await query('DELETE FROM users WHERE username = $1', ['testuser']);
    // Close database pool to allow Jest to exit
    await closePool();
  });

  describe('GET /api/settings/threshold', () => {
    it('should return confidence threshold', async () => {
      const cookieHeader = authCookies.length > 0 ? authCookies.join('; ') : '';
      
      const response = await request(app)
        .get('/api/settings/threshold')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(response.body.threshold).toBeDefined();
      expect(typeof response.body.threshold).toBe('number');
      expect(response.body.threshold).toBeGreaterThanOrEqual(0);
      expect(response.body.threshold).toBeLessThanOrEqual(1);
    });
  });

  describe('PUT /api/settings/threshold', () => {
    it('should update confidence threshold', async () => {
      const cookieHeader = authCookies.length > 0 ? authCookies.join('; ') : '';
      const newThreshold = 0.9;

      const response = await request(app)
        .put('/api/settings/threshold')
        .set('Cookie', cookieHeader)
        .send({ threshold: newThreshold })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.threshold).toBe(newThreshold);

      // Verify it was saved
      const getResponse = await request(app)
        .get('/api/settings/threshold')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(getResponse.body.threshold).toBe(newThreshold);
    });

    it('should reject invalid threshold values', async () => {
      const cookieHeader = authCookies.length > 0 ? authCookies.join('; ') : '';
      
      const response = await request(app)
        .put('/api/settings/threshold')
        .set('Cookie', cookieHeader)
        .send({ threshold: 1.5 }) // Invalid: > 1
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
