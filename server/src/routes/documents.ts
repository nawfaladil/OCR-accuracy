import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import * as documentController from '../controllers/documentController';
import * as path from 'path';
import * as fs from 'fs/promises';
import { query } from '../db/connection';
import { readJSONFile } from '../utils/fileHandler';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Serve PDF file
router.get('/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT pdf_path FROM documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const pdfPath = result.rows[0].pdf_path;
    
    // Check if file exists
    try {
      await fs.access(pdfPath);
    } catch {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    // Set proper headers for PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.sendFile(path.resolve(pdfPath));
  } catch (error: any) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get OCR JSON data
router.get('/:id/json', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT json_path FROM documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const jsonPath = result.rows[0].json_path;
    const jsonData = await readJSONFile(jsonPath);
    
    res.json(jsonData);
  } catch (error: any) {
    console.error('Error serving JSON:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create document (ingestion endpoint)
router.post('/', requireAuth, upload.single('pdf'), documentController.createDocument);

// Get all documents (with optional filtering)
router.get('/', requireAuth, documentController.getDocuments);

// Get single document
router.get('/:id', requireAuth, documentController.getDocument);

// Update field value
router.put('/:id/fields/:fieldId', requireAuth, documentController.updateField);

// Mark document as completed
router.put('/:id/complete', requireAuth, documentController.completeDocument);

export default router;
