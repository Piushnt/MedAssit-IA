import { GoogleGenerativeAI } from "@google/generative-ai";
import { HealthDocument, MedicalStudy } from "../types";

// Helper to get the API key securely
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY is missing via import.meta.env");
    // Fallback/Check for empty string
    return "";
  }
  return key;
};

// Initialize the SDK
const genAI = new GoogleGenerativeAI(getApiKey());

const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:.*?;base64,/, "");
};

/**
 * Nettoie une transcription brute de consultation pour supprimer les hésitations
 * et améliorer la ponctuation avant structuration.
 */
export const improveTranscript = async (rawTranscript: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `En tant que scribe médical expert, nettoie cette transcription brute. 
      Instructions :
      1. Supprime les bégaiements, hésitations ('euh', 'ben', 'alors') et tics de langage.
      2. Corrige la ponctuation et la grammaire sans modifier le sens médical.
      3. Préserve l'intégralité des faits cliniques, dosages et symptômes mentionnés.
      4. Si le médecin s'adresse directement à toi ("Scribe, note que..."), reformule pour le dossier patient.
      
      Texte brut :\n\n"${rawTranscript}"`
        }]
      }],
      generationConfig: { temperature: 0.1 }
    });
    return result.response.text() || rawTranscript;
  } catch (err) {
    console.error("AI Error:", err);
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

  try {
    // Note: 'systemInstruction' is supported in the new SDK but requires specific initialization or beta version for older models.
    // gemini-1.5-pro supports systemInstruction via systemInstruction param in getGenerativeModel
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: {
        temperature: 0.1,
        // thinkingConfig not yet standard in this SDK version or requires newer model
      }
    });
    return result.response.text() || "Désolé, l'analyse a échoué.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur d'accès à l'intelligence clinique. Vérifiez la connectivité et la clé API.";
  }
};

export const generateSOAPNote = async (transcript: string): Promise<string> => {
  const systemInstruction = `Vous êtes un Scribe Médical Certifié. Transformez la transcription suivante en une note SOAP officielle.
  STRUCTURE IMPÉRATIVE :
  - SUBJECTIF : Motifs de consultation, antécédents racontés, symptômes décrits par le patient.
  - OBJECTIF : Signes cliniques observés, constantes dictées (TA, Pouls), résultats d'examen mentionnés.
  - ANALYSE (Assessment) : Hypothèses diagnostiques et synthèse de l'état clinique.
  - PLAN : Examens complémentaires à prévoir, traitements prescrits, conseils donnés et suivi.
  
  Utilisez une terminologie médicale standardisée et un ton professionnel.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `TRANSCRIPTION DE LA CONSULTATION :\n${transcript}` }] }],
      generationConfig: { temperature: 0.2 }
    });
    return result.response.text() || "Échec de la structuration SOAP.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur critique du Scribe IA.";
  }
};

export const searchMedicalGuidelines = async (query: string): Promise<{ text: string, sources: any[] }> => {
  try {
    // Note: Tools/Google Search might not be fully supported in the basic client SDK without valid config/permissions
    // For now we map it as a standard request, assuming the model has built-in knowledge or user handles tools elsewhere.
    // If specific googleSearch tool is needed, it must be configured in tools.
    // gemini-1.5-pro supports tools.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      // tools: [{ googleSearch: {} }] // Removed for basic stability unless confirmed supported by key
    });

    // Fallback prompt for guidelines
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Quelles sont les recommandations médicales actuelles et officielles pour : ${query} ? Formulez une réponse structurée pour un médecin.` }] }],
      generationConfig: {
        temperature: 0.1
      },
    });

    return {
      text: result.response.text() || "Recherche infructueuse.",
      sources: [] // metadata grounding not always available in standard text response without specific tool use
    };
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Le service de recherche médicale est indisponible.", sources: [] };
  }
};

export const analyzeClinicalDocument = async (doc: HealthDocument): Promise<string> => {
  const parts: any[] = [];
  if (doc.mimeType && doc.mimeType.startsWith('image/')) {
    parts.push({ inlineData: { data: cleanBase64(doc.content), mimeType: doc.mimeType } });
  } else {
    parts.push({ text: doc.content });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Analysez ce document clinique. Extrayez les 3 informations les plus critiques pour le suivi du patient et notez toute anomalie biologique majeure."
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: { temperature: 0 }
    });
    return result.response.text() || "Analyse automatique échouée.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Erreur d'analyse IA.";
  }
};