
import { Patient, Doctor, AdviceLog, AuditEntry } from '../types';

const KEYS = {
  DOCTOR: 'med_pro_profile',
  PATIENTS: 'med_pro_patients',
  GLOBAL_DOCS: 'med_global_docs',
  AUDIT_LOGS: 'med_audit_logs'
};

export const StorageService = {
  saveDoctor: (doctor: Doctor) => localStorage.setItem(KEYS.DOCTOR, JSON.stringify(doctor)),
  getDoctor: (): Doctor | null => {
    const d = localStorage.getItem(KEYS.DOCTOR);
    return d ? JSON.parse(d) : null;
  },
  
  savePatients: (patients: Patient[]) => localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients)),
  getPatients: (): Patient[] => {
    const p = localStorage.getItem(KEYS.PATIENTS);
    return p ? JSON.parse(p) : [];
  },

  saveGlobalDocs: (docs: any[]) => localStorage.setItem(KEYS.GLOBAL_DOCS, JSON.stringify(docs)),
  getGlobalDocs: (): any[] => {
    const d = localStorage.getItem(KEYS.GLOBAL_DOCS);
    return d ? JSON.parse(d) : [];
  },
  
  addPatient: (patient: Patient) => {
    const ps = StorageService.getPatients();
    StorageService.savePatients([patient, ...ps]);
    StorageService.logAudit('Création Dossier Patient', 'medium', patient.id);
  },

  addConsultationToPatient: (patientId: string, log: AdviceLog) => {
    const patients = StorageService.getPatients();
    const updatedPatients = patients.map(p => {
      if (p.id === patientId) {
        return { ...p, consultations: [log, ...(p.consultations || [])] };
      }
      return p;
    });
    StorageService.savePatients(updatedPatients);
    StorageService.logAudit('Consultation IA', 'low', patientId);
    return updatedPatients;
  },

  getAuditLogs: (): AuditEntry[] => {
    const logs = localStorage.getItem(KEYS.AUDIT_LOGS);
    return logs ? JSON.parse(logs) : [];
  },

  logAudit: (action: string, severity: 'low' | 'medium' | 'high', resourceId?: string) => {
    const doctor = StorageService.getDoctor();
    const logs = StorageService.getAuditLogs();
    const newEntry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      user: doctor?.name || 'Système',
      severity,
      resourceId
    };
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify([newEntry, ...logs].slice(0, 100)));
  },

  logout: () => {
    StorageService.logAudit('Déconnexion Praticien', 'low');
    localStorage.removeItem(KEYS.DOCTOR);
  },

  clearAll: () => {
    localStorage.clear();
  }
};
