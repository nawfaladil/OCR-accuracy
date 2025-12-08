import { Pool, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables before creating pool
// Ensure we load from the server directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const getPool = (): Pool => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'videocodage_db',
    user: process.env.DB_USER || 'videocodage_user',
    password: process.env.DB_PASSWORD || 'videocodage_pw',
  };
  
  // Log connection config (without password) for debugging
  console.log('Database connection config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    passwordSet: !!config.password,
  });
  
  return new Pool(config);
};

let pool: Pool | null = null;

const getOrCreatePool = (): Pool => {
  if (!pool) {
    pool = getPool();
  }
  return pool;
};

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const pool = getOrCreatePool();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    const pool = getOrCreatePool();
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    // Create tables
    await createTables();
    
    // Initialize default settings
    await initializeSettings();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const createTables = async (): Promise<void> => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createDocumentsTable = `
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL,
      pdf_path VARCHAR(500) NOT NULL,
      json_path VARCHAR(500) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      is_flagged BOOLEAN DEFAULT FALSE,
      flagged_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      reviewed_by INTEGER REFERENCES users(id)
    );
  `;
  
  const createFieldsTable = `
    CREATE TABLE IF NOT EXISTS fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
      field_name VARCHAR(255) NOT NULL,
      field_value TEXT,
      bounding_box JSONB NOT NULL,
      confidence DECIMAL(3,2) NOT NULL,
      page_number INTEGER NOT NULL,
      is_flagged BOOLEAN DEFAULT FALSE,
      updated_value TEXT,
      updated_at TIMESTAMP
    );
  `;
  
  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  // Create indexes
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_documents_flagged ON documents(is_flagged) WHERE is_flagged = TRUE;
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_fields_document ON fields(document_id);
    CREATE INDEX IF NOT EXISTS idx_fields_confidence ON fields(confidence);
  `;
  
  try {
    await query(createUsersTable);
  } catch (error: any) {
    // Ignore errors about already existing tables/sequences
    if (error.code !== '23505' && error.code !== '42P07') {
      throw error;
    }
  }
  
  try {
    await query(createDocumentsTable);
  } catch (error: any) {
    if (error.code !== '23505' && error.code !== '42P07') {
      throw error;
    }
  }
  
  try {
    await query(createFieldsTable);
  } catch (error: any) {
    if (error.code !== '23505' && error.code !== '42P07') {
      throw error;
    }
  }
  
  try {
    await query(createSettingsTable);
  } catch (error: any) {
    if (error.code !== '23505' && error.code !== '42P07') {
      throw error;
    }
  }
  
  try {
    await query(createIndexes);
  } catch (error: any) {
    // Ignore index creation errors if they already exist
    if (error.code !== '42P07') {
      throw error;
    }
  }
  
  console.log('Database tables created successfully');
};

const initializeSettings = async (): Promise<void> => {
  const defaultThreshold = parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85');
  
  const insertSetting = `
    INSERT INTO settings (key, value)
    VALUES ('confidence_threshold', $1)
    ON CONFLICT (key) DO NOTHING;
  `;
  
  await query(insertSetting, [defaultThreshold.toString()]);
  console.log('Default settings initialized');
};

export const closePool = async (): Promise<void> => {
  if (pool && !pool.ended) {
    await pool.end();
    pool = null;
  }
};

// Export a function instead of creating pool immediately
// This ensures dotenv.config() runs first
export default (): Pool => getOrCreatePool();
