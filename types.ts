
export interface HealthDocument {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 for images or extracted text
  mimeType: string;
  timestamp: number;
  anonymized: boolean;
}

export interface AdviceLog {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  sources: string[];
}

export interface UserState {
  documents: HealthDocument[];
  logs: AdviceLog[];
}
