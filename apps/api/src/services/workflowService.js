const axios = require('axios');
const documentRepository = require('../repositories/documentRepository');

async function triggerDocumentProcessing(documentRecord) {
  try {
    const payload = {
      documentId: documentRecord.id,
      documentText: null,
      fileBase64: documentRecord.file_data,
      mimeType: documentRecord.mime_type,
      patientAge: documentRecord.patient_age
    };

    const targetUrl = process.env.LOGIC_APP_URL || process.env.AZURE_FUNCTION_URL || 'http://localhost:7071/api/process-document';
    
    const response = await axios.post(targetUrl, payload);
    const result = response.data;
    
    await documentRepository.updateDocumentProcessingResult(documentRecord.id, result);
    
    return result;
  } catch (error) {
    console.error('Error triggering processing workflow:', error.message);
    await documentRepository.updateDocumentStatusToFailed(documentRecord.id, error.message);
    throw error;
  }
}

module.exports = {
  triggerDocumentProcessing
};
