const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a specialized clinical document parser. Your goal is to extract Blood Pressure (BP) and HbA1c (A1C) readings from the provided text or document.
Output strict JSON with the following structure:
{
  "document_type": "BP" | "A1C" | "UNKNOWN",
  "patient_age": number | null,
  "ai_confidence_score": float (0.0 to 1.0 based on readability and clarity),
  "extracted_values": [
    {
      "value": "string (e.g., '138/88' for BP, '7.4%' for A1C)",
      "date": "YYYY-MM-DD" | null,
      "label": "string (e.g., 'current reading', 'goal', 'historical', 'target', 'reference range')"
    }
  ]
}
If no clear BP or A1C data is found, set document_type to "UNKNOWN" and extracted_values to [].
`;

async function extractClinicalData({ documentText, fileBase64, mimeType }) {
  try {
    let contents = [];
    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType
        }
      });
    }
    if (documentText) {
      contents.push({ text: documentText });
    }

    if (contents.length === 0) {
      throw new Error("No document content provided.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text();
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error extracting clinical data:", error);
    throw error;
  }
}

module.exports = {
  extractClinicalData
};
