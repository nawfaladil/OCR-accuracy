import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import * as path from 'path';
import { initDatabase } from './db/connection';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import settingsRoutes from './routes/settings';

// Load environment variables from server/.env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
  name: 'connect.sid', // Default session name
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  initDatabase()
    .then(() => {
      console.log('Database initialized successfully');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

export default app;
