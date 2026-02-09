
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy } from "../types";

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
  sources: MedicalStudy[] = [],
  patientAllergies: string[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const allergyContext = patientAllergies.length > 0 
    ? `ATTENTION CRITIQUE : Le patient présente les allergies suivantes : ${patientAllergies.join(', ')}. Toute recommandation médicamenteuse doit être vérifiée par rapport à ces contre-indications.`
    : "Aucune allergie connue renseignée.";

  const systemInstruction = isSummary 
    ? `Vous êtes un assistant IA médical expert. ${allergyContext} Générez une synthèse clinique structurée et holistique.`
    : `Vous êtes un assistant IA médical expert. ${allergyContext} Répondez aux questions cliniques en vous basant sur les documents fournis. Si une situation est critique ou présente un risque allergique, commencez par '⚠️ ALERTE'.`;

  const parts: any[] = [];

  documents.forEach((doc) => {
    if (doc.mimeType && doc.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType }
      });
      parts.push({ text: `Analyse visuelle du document : ${doc.name}` });
    } else {
      parts.push({ text: `Contenu du document ${doc.name}:\n${doc.content}` });
    }
  });

  if (sources.length > 0) {
    const studiesContext = sources.map(s => `[${s.id}] ${s.titre}: ${s.contenu_texte}`).join('\n');
    parts.push({ text: `Références scientifiques et protocoles :\n${studiesContext}` });
  }

  parts.push({ text: `Requête clinique :\n${prompt}` });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: { 
        systemInstruction,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    return response.text || "Analyse clinique impossible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur technique de diagnostic. Vérifiez votre configuration de clé API.";
  }
};

/**
 * Clean raw transcript from filler words and improve punctuation
 */
export const improveTranscript = async (rawTranscript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = "Vous êtes un assistant scribe. Nettoyez cette transcription brute de consultation : supprimez les hésitations (euh, bah), corrigez la ponctuation et rendez le texte fluide tout en gardant l'intégralité du sens médical.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: rawTranscript,
      config: { systemInstruction, temperature: 0.1 }
    });
    return response.text || rawTranscript;
  } catch (err) {
    return rawTranscript;
  }
};

/**
 * Expert SOAP generator for Ambient Scribe
 */
export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `Vous êtes un scribe médical expert. Transformez la transcription brute d'une consultation en une note SOAP structurée (Subjectif, Objectif, Analyse, Plan), professionnelle et précise. Utilisez une terminologie médicale standard.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transcription de la consultation :\n${transcript}`,
      config: { 
        systemInstruction,
        temperature: 0.1,
      }
    });
    return response.text || "Erreur lors de la structuration SOAP.";
  } catch (error) {
    console.error("SOAP Error:", error);
    return "L'IA n'a pas pu structurer la note.";
  }
};

/**
 * Search medical guidelines
 */
export const searchMedicalGuidelines = async (query: string): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Quelles sont les dernières recommandations médicales concernant : ${query} ? Répondez en français.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 16384 }
      },
    });
    return {
      text: response.text || "Aucun résultat.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { text: "Erreur recherche live.", sources: [] };
  }
};

/**
 * Rapid analysis of an uploaded clinical document
 */
export const analyzeClinicalDocument = async (doc: HealthDocument): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = "Analysez ce document médical (Bio, Imagerie ou CR). Extrayez 3 points clés et notez toute anomalie majeure. Si le document contient plusieurs pages/parties, faites une synthèse globale.";
  const parts: any[] = [];

  if (doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: `Document : ${doc.name}\nContenu : ${doc.content}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { systemInstruction, temperature: 0 }
    });
    return response.text || "Analyse automatique non disponible.";
  } catch (error) {
    return "Échec de l'analyse.";
  }
};
