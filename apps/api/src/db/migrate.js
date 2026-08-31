require('dotenv').config();
const { pool } = require('../config/db');

async function migrate() {
  console.log('Running database migrations...');
  const queryText = `
    CREATE TABLE IF NOT EXISTS clinical_documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        file_data TEXT,
        mime_type VARCHAR(100),
        document_type VARCHAR(20),
        measure VARCHAR(100),
        measurement_date DATE,
        patient_age INT,
        status VARCHAR(30) NOT NULL DEFAULT 'Pending',
        confidence_score NUMERIC(4, 2),
        failure_reason TEXT,
        raw_extracted_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Migration successful: clinical_documents table created/verified.');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Allow running from CLI directly or importing
if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = migrate;
