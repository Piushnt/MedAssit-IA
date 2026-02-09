import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy } from "../types";

const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:.*?;base64,/, "");
};

/**
 * Nettoie une transcription brute de consultation pour supprimer les hésitations
 * et améliorer la ponctuation avant structuration.
 */
export const improveTranscript = async (rawTranscript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Nettoie cette transcription médicale brute. Supprime les 'euh', les répétitions inutiles et corrige la ponctuation sans altérer le sens clinique :\n\n"${rawTranscript}"`,
      config: { temperature: 0.1 }
    });
    return response.text || rawTranscript;
  } catch (err) {
    return rawTranscript;
  }
};

export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[],
  isSummary: boolean = false,
  sources: MedicalStudy[] = [],
  patientAllergies: string[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const allergyContext = patientAllergies.length > 0 
    ? `ATTENTION : Allergies du patient : ${patientAllergies.join(', ')}.`
    : "Pas d'allergies connues.";

  const systemInstruction = isSummary 
    ? `Expert médical. ${allergyContext} Crée une synthèse holistique.`
    : `Expert médical. ${allergyContext} Aide au diagnostic.`;

  const parts: any[] = documents.map(doc => {
    if (doc.mimeType && doc.mimeType.startsWith('image/')) {
      return { inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } };
    }
    return { text: `Document ${doc.name}: ${doc.content}` };
  });

  if (sources.length > 0) {
    parts.push({ text: `Protocoles: ${sources.map(s => s.contenu_texte).join('\n')}` });
  }

  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: { 
        systemInstruction,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Erreur de réponse.";
  } catch (error) {
    return "Erreur d'accès API.";
  }
};

export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `Scribe médical expert. Transforme la transcription en note SOAP structurée (Subjectif, Objectif, Analyse, Plan). Sois précis et professionnel.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transcription :\n${transcript}`,
      config: { systemInstruction, temperature: 0.1 }
    });
    return response.text || "Échec de structuration.";
  } catch (error) {
    return "Erreur Scribe.";
  }
};

export const searchMedicalGuidelines = async (query: string): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Recommandations officielles (HAS/EMA) pour : ${query}`,
      config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 16384 } },
    });
    return {
      text: response.text || "Aucun résultat.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { text: "Erreur de recherche live.", sources: [] };
  }
};

export const analyzeClinicalDocument = async (doc: HealthDocument): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  if (doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: doc.content });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { systemInstruction: "Analyse ce document médical. Résume en 3 points clés.", temperature: 0 }
    });
    return response.text || "Extraction impossible.";
  } catch (error) {
    return "Erreur analyse.";
  }
};