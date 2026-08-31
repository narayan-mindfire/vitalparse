const workflowService = require('../services/workflowService');
const documentRepository = require('../repositories/documentRepository');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const fileBase64 = buffer.toString('base64');
    let patientAge = req.body.patientAge ? parseInt(req.body.patientAge, 10) : null;
    if (isNaN(patientAge)) patientAge = null;

    const newRecord = await documentRepository.createDocument(originalname, fileBase64, mimetype, patientAge);

    // Trigger async processing workflow, do not block the response
    workflowService.triggerDocumentProcessing(newRecord).catch(err => {
      console.error('Async workflow processing failed:', err);
    });

    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to upload document.' });
  }
}

async function getDocuments(req, res) {
  try {
    const documents = await documentRepository.getAllDocuments();
    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents.' });
  }
}

async function retryDocument(req, res) {
  try {
    const { id } = req.params;
    const document = await documentRepository.getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const updatedDocument = await documentRepository.resetDocumentStatusToPending(id);

    workflowService.triggerDocumentProcessing(updatedDocument).catch(err => {
      console.error('Async workflow processing failed:', err);
    });

    return res.status(200).json(updatedDocument);
  } catch (error) {
    console.error('Error retrying document:', error);
    return res.status(500).json({ error: 'Failed to retry document.' });
  }
}

module.exports = {
  uploadDocument,
  getDocuments,
  retryDocument
};
