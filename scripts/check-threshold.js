const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'videocodage_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkThreshold() {
  try {
    console.log('Checking confidence threshold in database...\n');
    
    const result = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['confidence_threshold']
    );
    
    if (result.rows.length === 0) {
      console.log('No threshold found in database. Default would be: 0.85');
    } else {
      const threshold = parseFloat(result.rows[0].value);
      console.log(`Current threshold in database: ${threshold}\n`);
      
      // Check the sample document fields
      console.log('Checking sample document fields...');
      const docResult = await pool.query(
        `SELECT id FROM documents WHERE filename LIKE '%sample%' ORDER BY created_at DESC LIMIT 1`
      );
      
      if (docResult.rows.length > 0) {
        const docId = docResult.rows[0].id;
        console.log(`Found document: ${docId}\n`);
        
        const fieldsResult = await pool.query(
          `SELECT field_name, confidence, is_flagged 
           FROM fields 
           WHERE document_id = $1 
           ORDER BY confidence ASC`,
          [docId]
        );
        
        console.log('Fields in database:');
        let flaggedCount = 0;
        fieldsResult.rows.forEach((field) => {
          const isBelowThreshold = parseFloat(field.confidence) < threshold;
          const status = isBelowThreshold ? 'FLAGGED' : 'OK';
          if (isBelowThreshold) flaggedCount++;
          console.log(`  - ${field.field_name}: confidence=${field.confidence}, is_flagged=${field.is_flagged}, ${status} (${field.confidence} < ${threshold})`);
        });
        
        console.log(`\nTotal flagged fields (confidence < ${threshold}): ${flaggedCount}`);
        console.log(`Fields marked as flagged in DB: ${fieldsResult.rows.filter(f => f.is_flagged).length}`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkThreshold();

