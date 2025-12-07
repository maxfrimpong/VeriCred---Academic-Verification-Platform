import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    extractedName: { type: Type.STRING, description: "The name of the student found on the document" },
    extractedInstitution: { type: Type.STRING, description: "The name of the university or institution" },
    extractedDegree: { type: Type.STRING, description: "The degree title (e.g., Bachelor of Science)" },
    extractedDate: { type: Type.STRING, description: "Graduation date or year found" },
    confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 100 regarding the legibility" },
    authenticityNotes: { type: Type.STRING, description: "Brief notes on whether the document looks like a standard academic certificate" },
    isTampered: { type: Type.BOOLEAN, description: "Whether there are obvious signs of digital editing or tampering" }
  },
  required: ["extractedName", "extractedInstitution", "extractedDegree", "confidenceScore", "isTampered"],
};

export const analyzeDocument = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // We will assume PNG/JPEG for simplicity in this demo
              data: base64Image
            }
          },
          {
            text: "Analyze this academic credential. Extract the student name, institution, degree, and date. Also assess if it looks authentic or if there are signs of tampering (like mismatched fonts, digital artifacts). Return the result in JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for demo purposes if API key is invalid or fails
    return {
      extractedName: "",
      extractedInstitution: "",
      extractedDegree: "",
      extractedDate: "",
      confidenceScore: 0,
      authenticityNotes: "AI Analysis failed. Please verify manually.",
      isTampered: false
    };
  }
};