
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument } from "../types";

export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare contents: Instructions + Context Documents + User Prompt
  const parts: any[] = [
    { text: `You are MedAssist-IA, a highly expert medical advisory agent. 
    Analyze the provided medical records (if any) and answer the user query accurately.
    IMPORTANT: 
    1. Provide data-driven insights based ONLY on the documents and medical best practices.
    2. ALWAYS include a prominent disclaimer: "Disclaimer: This is AI-generated advice and not a substitute for professional medical consultation. Always consult a certified physician."
    3. If the documents contain sensitive information, acknowledge it professionally.
    4. Focus on clarity and actionable health steps.` }
  ];

  // Add documents as parts if they are images or text
  documents.forEach((doc) => {
    if (doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          data: doc.content,
          mimeType: doc.mimeType
        }
      });
      parts.push({ text: `Document Name: ${doc.name}` });
    } else {
      parts.push({ text: `Context from ${doc.name}:\n${doc.content}` });
    }
  });

  parts.push({ text: `User Query: ${prompt}` });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // High performance & low latency
      contents: { parts },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with the medical intelligence engine.";
  }
};
