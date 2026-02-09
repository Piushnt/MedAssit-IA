
export interface MedicalStudy {
  id: string;
  titre: string;
  specialite: string;
  date_publication: string;
  niveau_preuve: 'A' | 'B' | 'C';
  contenu_texte: string;
}

export interface HealthDocument {
  id: string;
  name: string;
  type: string;
  content: string; 
  mimeType: string;
  timestamp: number;
  anonymized?: boolean;
  analysisSummary?: string;
}

export interface VitalEntry {
  timestamp: number;
  bmi?: number;
  bp?: string; // Format "120/80"
  hr?: number;
}

export interface Patient {
  id: string; // UUID interne
  patientId: string; // Identifiant métier (ex: PAT-2024-001)
  nomAnonymise: string;
  age: number;
  antecedents: string;
  allergies: string[];
  sexe: 'M' | 'F' | 'Autre';
  documents: HealthDocument[];
  consultations: AdviceLog[];
  vitalSigns?: VitalEntry;
  vitalsHistory: VitalEntry[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  isVerified: boolean;
  idCardPhoto?: string;
}

export interface AdviceLog {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  sources: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  user: string;
  resourceId?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScribeSession {
  id: string;
  startTime: number;
  transcript: string;
  summary?: string;
}
