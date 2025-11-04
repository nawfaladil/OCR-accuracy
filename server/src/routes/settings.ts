import express from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/connection';

const router = express.Router();

// Get confidence threshold
router.get('/threshold', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT value FROM settings WHERE key = $1',
      ['confidence_threshold']
    );
    
    if (result.rows.length === 0) {
      const defaultThreshold = parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85');
      return res.json({ threshold: defaultThreshold });
    }
    
    res.json({ threshold: parseFloat(result.rows[0].value) });
  } catch (error: any) {
    console.error('Error fetching threshold:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update confidence threshold
router.put('/threshold', requireAuth, async (req, res) => {
  try {
    const { threshold } = req.body;
    
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      return res.status(400).json({ error: 'Threshold must be a number between 0 and 1' });
    }
    
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('confidence_threshold', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [threshold.toString()]
    );
    
    res.json({ success: true, threshold });
  } catch (error: any) {
    console.error('Error updating threshold:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
