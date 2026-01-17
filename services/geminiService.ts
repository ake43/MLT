
import { GoogleGenAI, Type } from "@google/genai";
import { Database } from "./db";

export const getTrainingInsights = async () => {
  const db = Database.get();
  const context = JSON.stringify({
    employees: db.employees.length,
    courses: db.courses,
    recentAttendance: db.attendance.slice(-10)
  });

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following training data context: ${context}, provide 3 high-level strategic insights for HR in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            insight: { type: Type.STRING },
            impact: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
