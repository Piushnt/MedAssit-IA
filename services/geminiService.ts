
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy, Patient, Doctor } from "../types";

// Export LocalStudy as an alias for MedicalStudy as expected by Dashboard
export type LocalStudy = MedicalStudy;

/**
 * Main query function for medical analysis and summaries using Gemini API
 */
export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[],
  isSummary: boolean = false,
  sources: MedicalStudy[] = []
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing from environment variables");

  // Initialize the Google GenAI client following guidelines
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = isSummary 
    ? "Vous êtes un assistant IA médical expert. Générez une synthèse clinique structurée, objective et exhaustive basée sur les documents fournis. Identifiez les tendances et les points d'alerte."
    : "Vous êtes un assistant IA médical expert. Répondez aux questions cliniques en vous appuyant exclusivement sur les documents du patient et les études scientifiques fournies. Citez vos sources avec [ID].";

  const parts: any[] = [{ text: systemInstruction }];

  // Add patient documents to the context
  documents.forEach((doc) => {
    if (doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: { data: doc.content, mimeType: doc.mimeType }
      });
      parts.push({ text: `Document visuel (ID: ${doc.id}): ${doc.name}` });
    } else {
      parts.push({ text: `Contenu du document ${doc.name}:\n${doc.content}` });
    }
  });

  // Add RAG sources (scientific studies)
  if (sources.length > 0) {
    const studiesContext = sources.map(s => `[ID: ${s.id}] ${s.titre} (Preuve: ${s.niveau_preuve}): ${s.contenu_texte}`).join('\n');
    parts.push({ text: `BASE DE DONNÉES SCIENTIFIQUE DE RÉFÉRENCE :\n${studiesContext}` });
  }

  // Add user prompt
  parts.push({ text: `Requête médicale :\n${prompt}` });

  try {
    // Using gemini-3-pro-preview for complex reasoning and medical analysis
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        temperature: 0.1, // Set to low for maximum medical precision
      }
    });

    // Directly access the .text property of GenerateContentResponse
    return response.text || "Désolé, l'analyse n'a pas pu être finalisée.";
  } catch (error) {
    console.error("Gemini Diagnostic Error:", error);
    return "Erreur technique lors de la consultation du moteur de diagnostic expert.";
  }
};

/**
 * Specific function for clinical copilot reasoning, utilizing queryGemini
 */
export const queryMedicalCopilot = async (
  doctor: Doctor,
  patient: Patient,
  observation: string,
  relevantStudies: MedicalStudy[]
): Promise<string> => {
  // Leverage the primary query function
  return queryGemini(observation, patient.documents, false, relevantStudies);
};
