import { GoogleGenerativeAI } from "@google/generative-ai";
import { HealthDocument, MedicalStudy } from "../types";

// Helper to get the API key securely
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY is missing via import.meta.env");
    return "";
  }
  return key;
};

// Initialize the SDK - We keep a single instance
const genAI = new GoogleGenerativeAI(getApiKey());

const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:.*?;base64,/, "");
};

// List of models to try in order of preference/speed/cost
export const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-pro"
];

// Robust generator function that tries models in sequence
export const runGenAIWithFallback = async (
  payload: any[],
  systemInstruction?: string,
  temperature: number = 0.1
): Promise<string> => {
  if (!getApiKey()) return "Erreur: Clé API manquante.";

  let lastError: any = null;

  console.log(`[AI-DEBUG] Starting AI request. Payload parts: ${payload.length}`);

  for (const modelName of FALLBACK_MODELS) {
    console.log(`[AI-DEBUG] Attempting model: ${modelName}`);
    try {
      // Configure model
      const modelConfig: any = {
        model: modelName,
      };

      // systemInstruction support depends on model/SDK version, but passing it safe usually
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: payload }],
        generationConfig: { temperature }
      });

      const responseText = result.response.text();
      if (responseText) {
        console.log(`[AI-DEBUG] Success with model: ${modelName}`);
        return responseText;
      }
    } catch (error: any) {
      console.warn(`[AI-DEBUG] Model ${modelName} failed:`, error.message);
      lastError = error;
      // If it's not a 404 or capacity issue, it might be a request error, but we try next anyway to be safe
      // specifically 404 (model not found) is what we want to catch
    }
  }

  console.error("All AI models failed.", lastError);
  return `Erreur IA: Impossible de générer une réponse avec les modèles disponibles. (${lastError?.message || "Erreur inconnue"})`;
};

/**
 * Nettoie une transcription brute de consultation pour supprimer les hésitations
 * et améliorer la ponctuation avant structuration.
 */
export const improveTranscript = async (rawTranscript: string): Promise<string> => {
  const prompt = `En tant que scribe médical expert, nettoie cette transcription brute. 
      Instructions :
      1. Supprime les bégaiements, hésitations ('euh', 'ben', 'alors') et tics de langage.
      2. Corrige la ponctuation et la grammaire sans modifier le sens médical.
      3. Préserve l'intégralité des faits cliniques, dosages et symptômes mentionnés.
      4. Si le médecin s'adresse directement à toi ("Scribe, note que..."), reformule pour le dossier patient.
      
      Texte brut :\n\n"${rawTranscript}"`;

  return runGenAIWithFallback([{ text: prompt }], undefined, 0.1);
};

export const queryGemini = async (
  prompt: string,
  documents: HealthDocument[],
  isSummary: boolean = false,
  sources: MedicalStudy[] = [],
  patientAllergies: string[] = []
): Promise<string> => {
  const allergyContext = patientAllergies.length > 0
    ? `IMPORTANT : Le patient est ALLERGIQUE à : ${patientAllergies.join(', ')}. Toute suggestion de traitement doit exclure ces substances.`
    : "Aucune allergie connue renseignée.";

  const systemInstruction = isSummary
    ? `Vous êtes un Assistant Clinique de haut niveau. ${allergyContext} Synthétisez les documents du patient en un rapport cohérent mettant en évidence les tendances biologiques et les alertes potentielles.`
    : `Vous êtes un Expert Médical Assistant. ${allergyContext} Analysez les données fournies pour répondre précisément à la requête du praticien. Basez vos réponses sur les preuves cliniques présentes dans les documents.`;

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

  return runGenAIWithFallback(parts, systemInstruction, 0.1);
};

export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const systemInstruction = `Vous êtes un Scribe Médical Certifié. Transformez la transcription suivante en une note SOAP officielle.
  STRUCTURE IMPÉRATIVE :
  - SUBJECTIF : Motifs de consultation, antécédents racontés, symptômes décrits par le patient.
  - OBJECTIF : Signes cliniques observés, constantes dictées (TA, Pouls), résultats d'examen mentionnés.
  - ANALYSE (Assessment) : Hypothèses diagnostiques et synthèse de l'état clinique.
  - PLAN : Examens complémentaires à prévoir, traitements prescrits, conseils donnés et suivi.
  
  Utilisez une terminologie médicale standardisée et un ton professionnel.`;

  return runGenAIWithFallback([{ text: `TRANSCRIPTION DE LA CONSULTATION :\n${transcript}` }], systemInstruction, 0.2);
};

export const searchMedicalGuidelines = async (query: string): Promise<{ text: string, sources: any[] }> => {
  // Note: For basic search without tools, we just use the model's knowledge
  const prompt = `Quelles sont les recommandations médicales actuelles et officielles pour : ${query} ? Formulez une réponse structurée pour un médecin.`;

  const text = await runGenAIWithFallback([{ text: prompt }], undefined, 0.1);

  return {
    text: text,
    sources: [] // metadata grounding not available in basic fallback mode
  };
};

export const analyzeClinicalDocument = async (doc: HealthDocument): Promise<string> => {
  const parts: any[] = [];
  if (doc.mimeType && doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: doc.content });
  }

  const systemInstruction = "Analysez ce document clinique. Extrayez les 3 informations les plus critiques pour le suivi du patient et notez toute anomalie biologique majeure.";

  return runGenAIWithFallback(parts, systemInstruction, 0);
};