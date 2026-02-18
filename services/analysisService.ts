
import { HealthDocument, MedicalStudy, AdviceLog } from "../types";
import { runGenAIWithFallback } from "./geminiService";

const cleanBuffer = (data: string): string => {
  return data.replace(/^data:.*?;base64,/, "");
};

/**
 * Normalise le flux textuel issu d'une capture audio.
 */
export const optimiserFluxTexte = async (rawInput: string): Promise<string> => {
  const prompt = `Optimiser la clarté et la ponctuation du texte suivant tout en préservant l'intégralité des faits cliniques mentionnés :\n\n"${rawInput}"`;
  return runGenAIWithFallback([{ text: prompt }], undefined, 0.1, 0.6, 0.5);
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

  return runGenAIWithFallback(payload, systemInstruction, 0.1);
};

/**
 * Transforme un flux de consultation en note SOAP structurée.
 */
export const genererNoteCliniqueSOAP = async (transcript: string): Promise<string> => {
  const systemInstruction = "Expert Scribe Médical. Utiliser une terminologie clinique standardisée et professionnelle.";
  const prompt = `Structurer la transcription suivante en note SOAP officielle (Subjectif, Objectif, Analyse, Plan) :\n${transcript}`;

  return runGenAIWithFallback([{ text: prompt }], systemInstruction, 0.2);
};

/**
 * Recherche contextuelle dans les directives de santé mondiales.
 */
export const rechercherDirectivesSante = async (query: string): Promise<{ text: string, sources: any[] }> => {
  const prompt = `Quelles sont les recommandations cliniques actuelles et officielles pour : ${query} ? Formulez une réponse structurée destinée à un praticien.`;

  const text = await runGenAIWithFallback([{ text: prompt }], undefined, 0.1);

  return {
    text: text,
    sources: []
  };
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

  const systemInstruction = "Analyser le document clinique. Extraire les points critiques et signaler toute anomalie biologique majeure.";

  return runGenAIWithFallback(parts, systemInstruction, 0);
};

/**
 * Analyse approfondie d'un rapport historique pour une revue clinique post-consultation.
 */
export const analyserRapportHistorique = async (log: AdviceLog): Promise<string> => {
  const systemInstruction = "Expert Réviseur Clinique. Votre rôle est d'analyser une interaction passée entre un praticien et une IA pour identifier des points de vigilance, des suggestions de suivi ou des précisions médicales oubliées.";
  const prompt = `Veuillez analyser le rapport de consultation suivant :
  
  DATE: ${new Date(log.timestamp).toLocaleString('fr-FR')}
  REQUÊTE PRATICIEN: ${log.query}
  RÉPONSE IA: ${log.response}
  SOURCES UTILISÉES: ${log.sources.join(', ')}
  
  Objectif : Fournir une revue critique et constructive. Signalez tout point qui mériterait une attention particulière ou des examens complémentaires suggérés.`;

  return runGenAIWithFallback([{ text: prompt }], systemInstruction, 0.2);
};
