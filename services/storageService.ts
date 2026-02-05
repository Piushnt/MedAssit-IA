
import { HealthDocument, AdviceLog } from '../types';

const STORAGE_KEYS = {
  DOCUMENTS: 'medassist_documents',
  LOGS: 'medassist_logs',
};

export const StorageService = {
  saveDocuments: (docs: HealthDocument[]) => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  getDocuments: (): HealthDocument[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveLog: (log: AdviceLog) => {
    const logs = StorageService.getLogs();
    const updated = [log, ...logs].slice(0, 100); // Keep last 100
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
  },

  getLogs: (): AdviceLog[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
    return stored ? JSON.parse(stored) : [];
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
};
