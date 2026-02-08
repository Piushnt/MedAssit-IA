
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy, Patient, Doctor } from "../types";

export type LocalStudy = MedicalStudy;

/**
 * Utility to clean base64 string from data URL prefixes
 */
const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:.*?;base64,/, "");
};

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

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = isSummary 
    ? "Vous êtes un assistant IA médical expert. Générez une synthèse clinique structurée, objective et exhaustive basée sur les documents fournis. Identifiez les tendances et les points d'alerte."
    : "Vous êtes un assistant IA médical expert. Répondez aux questions cliniques en vous appuyant exclusivement sur les documents du patient et les études scientifiques fournies. Citez vos sources avec [ID]. Si une situation semble critique, commencez par '⚠️ URGENCE CRITIQUE'.";

  const parts: any[] = [{ text: systemInstruction }];

  // Add patient documents to the context
  documents.forEach((doc) => {
    if (doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: { 
          data: cleanBase64(doc.content), 
          mimeType: doc.mimeType 
        }
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
    // Using gemini-3-flash-preview for speed and efficiency on mid-range hardware
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "Désolé, l'analyse n'a pas pu être finalisée.";
  } catch (error) {
    console.error("Gemini Diagnostic Error:", error);
    return "Erreur technique lors de la consultation du moteur de diagnostic expert.";
  }
};

/**
 * Specific function for clinical SOAP note generation
 */
export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const prompt = `En tant qu'assistant médical expert, transforme la transcription de consultation suivante en une note clinique structurée au format SOAP (Subjectif, Objectif, Appréciation, Plan). Ajoute impérativement le disclaimer légal à la fin.\n\nTRANSCRIPTION :\n${transcript}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    return response.text || "Erreur de génération du SOAP.";
  } catch (error) {
    console.error("SOAP Generation Error:", error);
    return "Échec de la structuration de la note clinique.";
  }
};

/**
 * Specific function for clinical copilot reasoning
 */
export const queryMedicalCopilot = async (
  doctor: Doctor,
  patient: Patient,
  observation: string,
  relevantStudies: MedicalStudy[]
): Promise<string> => {
  return queryGemini(observation, patient.documents, false, relevantStudies);
};
