
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HealthDocument, MedicalStudy } from "../types";

const ENGINE_MODELS = {
  FAST: 'gemini-1.5-flash',
  EXPERT: 'gemini-1.5-pro'
};

// Helper to get the API key securely
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY is missing via import.meta.env");
    return "";
  }
  return key;
};

// Initialize the SDK
const genAI = new GoogleGenerativeAI(getApiKey());

const cleanBuffer = (data: string): string => {
  return data.replace(/^data:.*?;base64,/, "");
};

/**
 * Normalise le flux textuel issu d'une capture audio.
 */
export const optimiserFluxTexte = async (rawInput: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: ENGINE_MODELS.FAST });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Optimiser la clarté et la ponctuation du texte suivant tout en préservant l'intégralité des faits cliniques mentionnés :\n\n"${rawInput}"` }] }],
      generationConfig: { temperature: 0.1 }
    });
    return result.response.text() || rawInput;
  } catch (err) {
    console.error("AI Error:", err);
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
    const model = genAI.getGenerativeModel({
      model: ENGINE_MODELS.EXPERT,
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: payload }],
      generationConfig: {
        temperature: 0.1,
      }
    });
    return result.response.text() || "Analyse interrompue par le système.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur technique du moteur d'analyse clinique.";
  }
};

/**
 * Transforme un flux de consultation en note SOAP structurée.
 */
export const genererNoteCliniqueSOAP = async (transcript: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({
      model: ENGINE_MODELS.FAST,
      systemInstruction: "Expert Scribe Médical. Utiliser une terminologie clinique standardisée et professionnelle."
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Structurer la transcription suivante en note SOAP officielle (Subjectif, Objectif, Analyse, Plan) :\n${transcript}` }] }],
      generationConfig: { temperature: 0.2 }
    });
    return result.response.text() || "Échec de la structuration de la note.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur du service de structuration SOAP.";
  }
};

/**
 * Recherche contextuelle dans les directives de santé mondiales.
 */
export const rechercherDirectivesSante = async (query: string): Promise<{ text: string, sources: any[] }> => {
  try {
    // Note: tools config for generic googleSearch requires specific support
    const model = genAI.getGenerativeModel({
      model: ENGINE_MODELS.EXPERT,
      // tools: [{ googleSearch: {} }] 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Quelles sont les recommandations cliniques actuelles et officielles pour : ${query} ? Formulez une réponse structurée destinée à un praticien.` }] }],
      generationConfig: {
        temperature: 0.1
      },
    });

    return {
      text: result.response.text() || "Recherche non concluante.",
      sources: [] // no grounding metadata in basic response
    };
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Le service de recherche clinique est momentanément indisponible.", sources: [] };
  }
};

/**
 * Analyse automatisée d'un document isolé.
 */
export const analyserPieceJointe = async (doc: HealthDocument): Promise<string> => {
  const parts: any[] = [];
  if (doc.mimeType && doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBuffer(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: doc.content });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: ENGINE_MODELS.FAST,
      systemInstruction: "Analyser le document clinique. Extraire les points critiques et signaler toute anomalie biologique majeure."
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: { temperature: 0 }
    });
    return result.response.text() || "Synthèse automatique non disponible.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur lors de l'indexation du document.";
  }
};
