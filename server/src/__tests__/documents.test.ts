import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import app from '../server';
import { query, initDatabase, closePool } from '../db/connection';
import bcrypt from 'bcrypt';

describe('Documents API', () => {
  let authCookies: string[];
  let testUserId: number;
  let testDocumentId: string;

  beforeAll(async () => {
    // Initialize database
    await initDatabase();
    
    // Clean up any existing test user first
    await query('DELETE FROM users WHERE username = $1', ['testuser']);
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create a test user
    const passwordHash = await bcrypt.hash('testpassword', 10);
    const result = await query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, username`,
      ['testuser', passwordHash]
    );
    testUserId = result.rows[0].id;

    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpassword' });
    
    const cookies = loginResponse.headers['set-cookie'];
    authCookies = (Array.isArray(cookies) 
      ? cookies 
      : cookies ? [cookies] : []).filter(Boolean) as string[];
  });

  afterAll(async () => {
    // Clean up test documents
    if (testDocumentId) {
      await query('DELETE FROM documents WHERE id = $1', [testDocumentId]);
    }
    // Clean up all test documents
    await query('DELETE FROM documents WHERE filename LIKE $1', ['test%.pdf']);
    await query('DELETE FROM documents WHERE filename LIKE $1', ['low-confidence%.pdf']);
    // Clean up test user
    await query('DELETE FROM users WHERE username = $1', ['testuser']);
    // Close database pool to allow Jest to exit (only close once)
    await closePool();
  });

  describe('POST /api/documents', () => {
    it('should create a document with valid PDF and JSON', async () => {
      // Create a minimal test PDF content (in a real test, use an actual PDF)
      const testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n25\n%%EOF');
      
      const testJson = {
        document: {
          filename: 'test.pdf',
          pages: [
            {
              pageNumber: 1,
              fields: [
                {
                  fieldName: 'Test Field',
                  fieldValue: 'Test Value',
                  boundingBox: { x: 100, y: 200, width: 150, height: 30 },
                  confidence: 0.95,
                  pageNumber: 1,
                },
              ],
            },
          ],
        },
      };

      const response = await request(app)
        .post('/api/documents')
        .set('Cookie', authCookies)
        .field('jsonData', JSON.stringify(testJson))
        .attach('pdf', testPdfBuffer, 'test.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.id).toBeDefined();
      
      testDocumentId = response.body.document.id;
    });

    it('should flag document when confidence is below threshold', async () => {
      const testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n25\n%%EOF');
      
      const testJson = {
        document: {
          filename: 'low-confidence.pdf',
          pages: [
            {
              pageNumber: 1,
              fields: [
                {
                  fieldName: 'Low Confidence Field',
                  fieldValue: 'Value',
                  boundingBox: { x: 100, y: 200, width: 150, height: 30 },
                  confidence: 0.7, // Below default threshold of 0.85
                  pageNumber: 1,
                },
              ],
            },
          ],
        },
      };

      const cookieHeader = authCookies.length > 0 ? authCookies.join('; ') : '';

      const response = await request(app)
        .post('/api/documents')
        .set('Cookie', cookieHeader)
        .field('jsonData', JSON.stringify(testJson))
        .attach('pdf', testPdfBuffer, 'low-confidence.pdf')
        .expect(201);

      expect(response.body.flagged).toBe(true);
      expect(response.body.lowConfidenceFieldCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/documents', () => {
    it('should return list of documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should filter flagged documents', async () => {
      const response = await request(app)
        .get('/api/documents?flagged=true')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.documents).toBeDefined();
      response.body.documents.forEach((doc: any) => {
        expect(doc.is_flagged).toBe(true);
      });
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return document details with fields', async () => {
      if (!testDocumentId) return;

      const response = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.document).toBeDefined();
      expect(response.body.document.ocrData).toBeDefined();
      expect(response.body.document.ocrData.document.pages).toBeDefined();
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/documents/${fakeId}`)
        .set('Cookie', authCookies)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });
});
