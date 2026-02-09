
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy, Patient, Doctor } from "../types";

/**
 * Utility to clean base64 string from data URL prefixes
 */
const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:.*?;base64,/, "");
};

/**
 * Main query function for medical analysis and summaries
 */
export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[],
  isSummary: boolean = false,
  sources: MedicalStudy[] = []
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = isSummary 
    ? "Vous êtes un assistant IA médical expert. Générez une synthèse clinique structurée (Antécédents, Clinique, Paraclinique, Synthèse). Soyez précis et concis."
    : "Vous êtes un assistant IA médical expert. Répondez aux questions cliniques en vous basant sur les documents fournis. Si une situation est critique, commencez par '⚠️ URGENCE'.";

  const parts: any[] = [{ text: systemInstruction }];

  documents.forEach((doc) => {
    if (doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType }
      });
      parts.push({ text: `Analyse du document visuel : ${doc.name}` });
    } else {
      parts.push({ text: `Contenu du document ${doc.name}:\n${doc.content}` });
    }
  });

  if (sources.length > 0) {
    const studiesContext = sources.map(s => `[${s.id}] ${s.titre}: ${s.contenu_texte}`).join('\n');
    parts.push({ text: `Références scientifiques :\n${studiesContext}` });
  }

  parts.push({ text: `Requête :\n${prompt}` });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { temperature: 0.1 }
    });

    return response.text || "Analyse impossible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur technique de diagnostic.";
  }
};

/**
 * Perform a grounded medical search using Google Search
 */
export const searchMedicalGuidelines = async (query: string): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Quelles sont les dernières recommandations médicales et publications scientifiques concernant : ${query} ? Répondez en français de manière structurée pour un médecin.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "Aucun résultat trouvé.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { text: "Erreur lors de la recherche scientifique en direct.", sources: [] };
  }
};

/**
 * Rapid analysis of an uploaded clinical document
 */
export const analyzeClinicalDocument = async (doc: HealthDocument): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [
    { text: "Analysez ce document médical. Identifiez le type de document (Bio, Imagerie, CR), extrayez 3 points clés et notez toute anomalie majeure." }
  ];

  if (doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: `Document : ${doc.name}\nContenu : ${doc.content}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { temperature: 0 }
    });
    return response.text || "Analyse automatique non disponible.";
  } catch (error) {
    return "Échec de l'analyse préliminaire.";
  }
};

export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Générer une note SOAP structurée à partir de cette consultation :\n${transcript}\n\nInclure également une section 'Diagnostics Différentiels Suggérés'.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { temperature: 0.2 }
  });
  return response.text || "Erreur SOAP.";
};
