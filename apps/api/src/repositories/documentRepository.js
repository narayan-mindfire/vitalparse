const db = require('../config/db');

async function createDocument(originalname, fileBase64, mimetype, patientAge) {
  const insertQuery = `
    INSERT INTO clinical_documents (filename, file_data, mime_type, patient_age, status)
    VALUES ($1, $2, $3, $4, 'Pending')
    RETURNING *
  `;
  const result = await db.query(insertQuery, [originalname, fileBase64, mimetype, patientAge]);
  return result.rows[0];
}

async function getAllDocuments() {
  const query = 'SELECT id, filename, mime_type, document_type, measure, measurement_date, patient_age, status, confidence_score, failure_reason, created_at, updated_at FROM clinical_documents ORDER BY created_at DESC';
  const result = await db.query(query);
  return result.rows;
}

async function getDocumentById(id) {
  const findQuery = 'SELECT * FROM clinical_documents WHERE id = $1';
  const result = await db.query(findQuery, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function updateDocumentProcessingResult(id, result) {
  const updateQuery = `
    UPDATE clinical_documents 
    SET 
      document_type = $1, 
      measure = $2, 
      measurement_date = $3, 
      status = $4, 
      confidence_score = $5, 
      failure_reason = $6, 
      raw_extracted_json = $7,
      updated_at = NOW()
    WHERE id = $8
  `;
  const values = [
    result.document_type || 'UNKNOWN',
    result.measure || null,
    result.measurement_date || null,
    result.status || 'Failed',
    result.confidence_score || 0,
    result.failure_reason || null,
    JSON.stringify(result),
    id
  ];
  await db.query(updateQuery, values);
}

async function updateDocumentStatusToFailed(id, errorMessage) {
  const failQuery = `
    UPDATE clinical_documents 
    SET status = 'Failed', failure_reason = $1, updated_at = NOW() 
    WHERE id = $2
  `;
  await db.query(failQuery, [errorMessage, id]);
}

async function resetDocumentStatusToPending(id) {
  const resetQuery = `
    UPDATE clinical_documents
    SET status = 'Pending', failure_reason = NULL, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const resetResult = await db.query(resetQuery, [id]);
  return resetResult.rows[0];
}

module.exports = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocumentProcessingResult,
  updateDocumentStatusToFailed,
  resetDocumentStatusToPending
};
