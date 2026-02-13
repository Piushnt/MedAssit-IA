
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { HealthDocument, MedicalStudy } from "../types";

const ENGINE_MODELS = {
  FAST: 'gemini-3-flash-preview',
  EXPERT: 'gemini-3-pro-preview'
};

const cleanBuffer = (data: string): string => {
  return data.replace(/^data:.*?;base64,/, "");
};

/**
 * Normalise le flux textuel issu d'une capture audio.
 */
export const optimiserFluxTexte = async (rawInput: string): Promise<string> => {
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await engine.models.generateContent({
      model: ENGINE_MODELS.FAST,
      contents: `Optimiser la clarté et la ponctuation du texte suivant tout en préservant l'intégralité des faits cliniques mentionnés :\n\n"${rawInput}"`,
      config: { temperature: 0.1 }
    });
    return response.text || rawInput;
  } catch (err) {
    return rawInput;
  }
};

/**
 * Analyse approfondie des données cliniques du dossier.
 */
export const traiterRequeteClinique = async (
  query: string,
  documents: HealthDocument[],
  isSummary: boolean = false,
  sources: MedicalStudy[] = [],
  patientAllergies: string[] = []
): Promise<string> => {
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const ctxAllergy = patientAllergies.length > 0 
    ? `CONTEXTE : Le patient présente des allergies à : ${patientAllergies.join(', ')}. Toute recommandation thérapeutique doit en tenir compte.`
    : "";

  const systemInstruction = isSummary 
    ? `Rôle : Assistant Clinique Senior. ${ctxAllergy} Réalisez une synthèse structurée des données biologiques et cliniques pour identifier les points critiques.`
    : `Rôle : Expert Support Médical. ${ctxAllergy} Analysez les pièces jointes pour répondre précisément à la requête du praticien en vous basant sur les preuves cliniques fournies.`;

  const payload: any[] = documents.map(doc => {
    if (doc.mimeType && doc.mimeType.startsWith('image/')) {
      return { inlineData: { data: cleanBuffer(doc.content), mimeType: doc.mimeType } };
    }
    return { text: `DOCUMENT [${doc.name}]:\n${doc.content}` };
  });

  if (sources.length > 0) {
    payload.push({ text: `BASE SCIENTIFIQUE DE RÉFÉRENCE :\n${sources.map(s => `[${s.id}] ${s.titre}: ${s.contenu_texte}`).join('\n')}` });
  }

  payload.push({ text: `REQUÊTE PRATICIEN :\n${query}` });

  try {
    const response: GenerateContentResponse = await engine.models.generateContent({
      model: ENGINE_MODELS.EXPERT,
      contents: { parts: payload },
      config: { 
        systemInstruction,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    return response.text || "Analyse interrompue par le système.";
  } catch (error) {
    return "Erreur technique du moteur d'analyse clinique.";
  }
};

/**
 * Transforme un flux de consultation en note SOAP structurée.
 */
export const genererNoteCliniqueSOAP = async (transcript: string): Promise<string> => {
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await engine.models.generateContent({
      model: ENGINE_MODELS.FAST,
      contents: `Structurer la transcription suivante en note SOAP officielle (Subjectif, Objectif, Analyse, Plan) :\n${transcript}`,
      config: { 
        systemInstruction: "Expert Scribe Médical. Utiliser une terminologie clinique standardisée et professionnelle.", 
        temperature: 0.2 
      }
    });
    return response.text || "Échec de la structuration de la note.";
  } catch (error) {
    return "Erreur du service de structuration SOAP.";
  }
};

/**
 * Recherche contextuelle dans les directives de santé mondiales.
 */
export const rechercherDirectivesSante = async (query: string): Promise<{text: string, sources: any[]}> => {
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await engine.models.generateContent({
      model: ENGINE_MODELS.EXPERT,
      contents: `Quelles sont les recommandations cliniques actuelles et officielles pour : ${query} ? Formulez une réponse structurée destinée à un praticien.`,
      config: { 
        tools: [{ googleSearch: {} }], 
        thinkingConfig: { thinkingBudget: 16384 } 
      },
    });
    return {
      text: response.text || "Recherche non concluante.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { text: "Le service de recherche clinique est momentanément indisponible.", sources: [] };
  }
};

/**
 * Analyse automatisée d'un document isolé.
 */
export const analyserPieceJointe = async (doc: HealthDocument): Promise<string> => {
  const engine = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  if (doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBuffer(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: doc.content });
  }

  try {
    const response = await engine.models.generateContent({
      model: ENGINE_MODELS.FAST,
      contents: { parts },
      config: { 
        systemInstruction: "Analyser le document clinique. Extraire les points critiques et signaler toute anomalie biologique majeure.", 
        temperature: 0 
      }
    });
    return response.text || "Synthèse automatique non disponible.";
  } catch (error) {
    return "Erreur lors de l'indexation du document.";
  }
};
