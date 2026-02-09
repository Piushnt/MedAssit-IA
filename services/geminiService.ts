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
      contents: `En tant que scribe médical expert, nettoie cette transcription brute. 
      Instructions :
      1. Supprime les bégaiements, hésitations ('euh', 'ben', 'alors') et tics de langage.
      2. Corrige la ponctuation et la grammaire sans modifier le sens médical.
      3. Préserve l'intégralité des faits cliniques, dosages et symptômes mentionnés.
      4. Si le médecin s'adresse directement à toi ("Scribe, note que..."), reformule pour le dossier patient.
      
      Texte brut :\n\n"${rawTranscript}"`,
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
    ? `IMPORTANT : Le patient est ALLERGIQUE à : ${patientAllergies.join(', ')}. Toute suggestion de traitement doit exclure ces substances.`
    : "Aucune allergie connue renseignée.";

  const systemInstruction = isSummary 
    ? `Vous êtes un Assistant Clinique de haut niveau. ${allergyContext} Synthétisez les documents du patient en un rapport cohérent mettant en évidence les tendances biologiques et les alertes potentielles.`
    : `Vous êtes un Expert Médical Assistant. ${allergyContext} Analysez les données fournies pour répondre précisément aux questions du praticien. Basez vos réponses sur les preuves cliniques présentes dans les documents.`;

  const parts: any[] = documents.map(doc => {
    if (doc.mimeType && doc.mimeType.startsWith('image/')) {
      return { inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } };
    }
    return { text: `DOCUMENT [${doc.name}]:\n${doc.content}` };
  });

  if (sources.length > 0) {
    parts.push({ text: `BASE DE CONNAISSANCES SCIENTIFIQUES :\n${sources.map(s => `[${s.id}] ${s.titre}: ${s.contenu_texte}`).join('\n')}` });
  }

  parts.push({ text: `REQUÊTE DU PRATICIEN :\n${prompt}` });

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
    return response.text || "Désolé, l'analyse a échoué.";
  } catch (error) {
    return "Erreur d'accès à l'intelligence clinique. Vérifiez la connectivité.";
  }
};

export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `Vous êtes un Scribe Médical Certifié. Transformez la transcription suivante en une note SOAP officielle.
  STRUCTURE IMPÉRATIVE :
  - SUBJECTIF : Motifs de consultation, antécédents racontés, symptômes décrits par le patient.
  - OBJECTIF : Signes cliniques observés, constantes dictées (TA, Pouls), résultats d'examen mentionnés.
  - ANALYSE (Assessment) : Hypothèses diagnostiques et synthèse de l'état clinique.
  - PLAN : Examens complémentaires à prévoir, traitements prescrits, conseils donnés et suivi.
  
  Utilisez une terminologie médicale standardisée et un ton professionnel.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `TRANSCRIPTION DE LA CONSULTATION :\n${transcript}`,
      config: { systemInstruction, temperature: 0.2 }
    });
    return response.text || "Échec de la structuration SOAP.";
  } catch (error) {
    return "Erreur critique du Scribe IA.";
  }
};

export const searchMedicalGuidelines = async (query: string): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Quelles sont les recommandations médicales actuelles et officielles pour : ${query} ? Formulez une réponse structurée pour un médecin.`,
      config: { 
        tools: [{ googleSearch: {} }], 
        thinkingConfig: { thinkingBudget: 16384 } 
      },
    });
    return {
      text: response.text || "Recherche infructueuse.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    return { text: "Le service de recherche médicale est indisponible.", sources: [] };
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
      config: { 
        systemInstruction: "Analysez ce document clinique. Extrayez les 3 informations les plus critiques pour le suivi du patient et notez toute anomalie biologique majeure.", 
        temperature: 0 
      }
    });
    return response.text || "Analyse automatique échouée.";
  } catch (error) {
    return "Erreur d'analyse IA.";
  }
};