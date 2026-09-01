const { app } = require('@azure/functions');
const { extractClinicalData } = require('./services/aiExtractor');
const { processClinicalRules } = require('./services/rulesEngine');
require('dotenv').config();

app.http('processDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'process-document',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const body = await request.json();
      const { documentText, fileBase64, mimeType, patientAge } = body;

      const aiExtractedData = await extractClinicalData({
        documentText,
        fileBase64,
        mimeType
      });

      // Override patient age if provided in request
      if (patientAge !== undefined && aiExtractedData.patient_age === null) {
          aiExtractedData.patient_age = patientAge;
      }

      const result = processClinicalRules(aiExtractedData);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (error) {
      context.error("Error processing document:", error);
      return {
        status: 500,
        jsonBody: {
          status: 'Failed',
          failure_reason: error.message
        }
      };
    }
  }
});
