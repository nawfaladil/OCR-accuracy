import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';
import { saveFile, saveJSON, readJSONFile } from '../utils/fileHandler';
import { checkDocumentForFlagging, saveFieldsToDatabase, getConfidenceThreshold } from '../utils/flagChecker';
import { OCRDocument } from '../../shared/types';

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required' });
      return;
    }
    
    if (!req.body.jsonData) {
      res.status(400).json({ error: 'OCR JSON data is required' });
      return;
    }
    
    const jsonData: OCRDocument = JSON.parse(req.body.jsonData);
    const documentId = uuidv4();
    
    // Save PDF file
    const pdfPath = await saveFile(req.file, documentId, 'document.pdf');
    
    // Save JSON file
    const jsonPath = await saveJSON(jsonData, documentId);
    
    // Check for flagging
    const { shouldFlag, lowConfidenceFields } = await checkDocumentForFlagging(jsonData);
    const threshold = await getConfidenceThreshold();
    
    // Save document to database
    const documentResult = await query(
      `INSERT INTO documents (
        id, filename, pdf_path, json_path, status, is_flagged, flagged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        documentId,
        jsonData.document.filename || req.file.originalname,
        pdfPath,
        jsonPath,
        'pending',
        shouldFlag,
        shouldFlag ? new Date() : null,
      ]
    );
    
    // Save fields to database
    await saveFieldsToDatabase(documentId, jsonData, threshold);
    
    res.status(201).json({
      success: true,
      document: documentResult.rows[0],
      flagged: shouldFlag,
      lowConfidenceFieldCount: lowConfidenceFields.length,
    });
  } catch (error: any) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { flagged, status } = req.query;
    
    let sql = 'SELECT * FROM documents';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (flagged === 'true') {
      conditions.push('is_flagged = TRUE');
    }
    
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await query(sql, params);
    
    // Get field counts for each document
    // Recalculate flagged count based on current threshold to ensure accuracy
    const currentThreshold = await getConfidenceThreshold();
    const documentsWithCounts = await Promise.all(
      result.rows.map(async (doc) => {
        const fieldCount = await query(
          `SELECT 
            COUNT(*) as total, 
            COUNT(*) FILTER (WHERE confidence < $1) as flagged_count 
           FROM fields 
           WHERE document_id = $2`,
          [currentThreshold, doc.id]
        );
        
        return {
          ...doc,
          totalFields: parseInt(fieldCount.rows[0].total),
          flaggedFieldsCount: parseInt(fieldCount.rows[0].flagged_count),
        };
      })
    );
    
    res.json({ documents: documentsWithCounts });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const documentResult = await query('SELECT * FROM documents WHERE id = $1', [id]);
    
    if (documentResult.rows.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    const document = documentResult.rows[0];
    
    // Get fields
    const fieldsResult = await query(
      'SELECT * FROM fields WHERE document_id = $1 ORDER BY page_number, field_name',
      [id]
    );
    
    // Convert database fields back to OCR format
    const pages: { [key: number]: any[] } = {};
    
    for (const field of fieldsResult.rows) {
      if (!pages[field.page_number]) {
        pages[field.page_number] = [];
      }
      
      pages[field.page_number].push({
        fieldName: field.field_name,
        fieldValue: field.updated_value || field.field_value,
        boundingBox: field.bounding_box,
        confidence: parseFloat(field.confidence),
        pageNumber: field.page_number,
        id: field.id,
        isFlagged: field.is_flagged,
      });
    }
    
    const ocrData = {
      document: {
        filename: document.filename,
        pages: Object.keys(pages).map((pageNum) => ({
          pageNumber: parseInt(pageNum),
          fields: pages[parseInt(pageNum)],
        })),
      },
    };
    
    res.json({
      document: {
        ...document,
        ocrData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params;
    const { value } = req.body;
    
    if (!value) {
      res.status(400).json({ error: 'Field value is required' });
      return;
    }
    
    // Update field
    await query(
      'UPDATE fields SET updated_value = $1, updated_at = NOW() WHERE id = $2 AND document_id = $3',
      [value, fieldId, id]
    );
    
    // Update document updated_at
    await query('UPDATE documents SET updated_at = NOW() WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating field:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await query(
      'UPDATE documents SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3',
      ['completed', req.userId, id]
    );
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error completing document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
