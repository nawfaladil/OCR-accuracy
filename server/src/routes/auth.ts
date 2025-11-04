import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/connection';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const result = await query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Check session endpoint
router.get('/me', (req, res) => {
  if (req.session && (req.session as any).userId) {
    res.json({
      authenticated: true,
      user: {
        id: (req.session as any).userId,
        username: (req.session as any).username,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Register endpoint (for initial setup - can be disabled later)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
