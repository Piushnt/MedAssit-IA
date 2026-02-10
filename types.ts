
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
  pageCount?: number;
}

export interface VitalEntry {
  timestamp: number;
  bmi?: number;
  weight?: number;
  bp?: string;
  hr?: number;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'reminded' | 'completed' | 'cancelled';
}

export interface Patient {
  id: string;
  patientId: string;
  nomAnonymise: string;
  age: number;
  antecedents: string;
  allergies: string[];
  sexe: 'M' | 'F' | 'Autre';
  documents: HealthDocument[];
  consultations: AdviceLog[];
  vitalSigns?: VitalEntry;
  vitalsHistory: VitalEntry[];
  appointments: Appointment[];
  doctorId: string; // Lien avec le docteur qui suit le patient
}

export interface Doctor {
  id: string;
  name: string;
  email: string; // Ajouté
  password: string; // Ajouté
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
