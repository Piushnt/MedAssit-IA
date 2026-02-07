
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument } from "../types";

export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[],
  isSummaryRequest: boolean = false
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are MedAssist-IA, a medical advisory expert.
  CONTEXT: You have access to the user's health records.
  
  RULES:
  1. EMERGENCY DETECTION: If the user describes life-threatening symptoms (chest pain, severe bleeding, difficulty breathing, stroke signs), you MUST start your response with "⚠️ URGENCE CRITIQUE DETECTÉE" and advise calling emergency services immediately (15/112).
  2. DATA-DRIVEN: Only use the documents provided for specific medical facts.
  3. DISCLAIMER: Always include: "Note: Ce conseil est généré par IA et ne remplace pas un médecin."
  4. LANGUAGE: Always respond in French.
  
  ${isSummaryRequest ? "TASK: Provide a comprehensive summary of the user's health history based on all provided documents. Look for trends (e.g., rising glucose, consistent blood pressure)." : ""}`;

  const parts: any[] = [{ text: systemInstruction }];

  documents.forEach((doc) => {
    if (doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          data: doc.content,
          mimeType: doc.mimeType
        }
      });
      parts.push({ text: `Document: ${doc.name}` });
    } else {
      parts.push({ text: `Contenu de ${doc.name}:\n${doc.content}` });
    }
  });

  parts.push({ text: `Requête utilisateur: ${prompt}` });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        temperature: 0.2, // Plus bas pour plus de précision factuelle
        topP: 0.8,
      }
    });

    return response.text || "Erreur de génération.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Impossible de contacter l'intelligence médicale.";
  }
};
