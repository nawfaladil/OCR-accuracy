import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../server';
import { query, initDatabase, closePool } from '../db/connection';
import bcrypt from 'bcrypt';

describe('Authentication API', () => {
  let testUser: any;

  beforeAll(async () => {
    // Initialize database
    await initDatabase();
    
    // Clean up any existing test user first
    await query('DELETE FROM users WHERE username = $1', ['testuser']);
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create a test user (use ON CONFLICT to avoid duplicates from parallel tests)
    const passwordHash = await bcrypt.hash('testpassword', 10);
    const result = await query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, username`,
      ['testuser', passwordHash]
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Clean up test user
    await query('DELETE FROM users WHERE username = $1', ['testuser']);
    // Close database pool to allow Jest to exit
    await closePool();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Wait a bit to ensure user is created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user when logged in', async () => {
      // Create an agent to maintain cookies between requests
      const agent = request.agent(app);
      
      // First login to get session
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // The agent should automatically handle cookies
      const response = await agent
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    it('should return unauthenticated when not logged in', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.authenticated).toBe(false);
    });
  });
});
