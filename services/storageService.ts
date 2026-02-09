
import { Patient, Doctor, AdviceLog, AuditEntry, MedicalStudy } from '../types';

const KEYS = {
  DOCTOR: 'med_pro_profile',
  PATIENTS: 'med_pro_patients',
  GLOBAL_DOCS: 'med_global_docs',
  AUDIT_LOGS: 'med_audit_logs',
  CUSTOM_STUDIES: 'med_custom_studies'
};

export const StorageService = {
  saveDoctor: (doctor: Doctor) => localStorage.setItem(KEYS.DOCTOR, JSON.stringify(doctor)),
  getDoctor: (): Doctor | null => {
    try {
      const d = localStorage.getItem(KEYS.DOCTOR);
      return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
  },
  
  savePatients: (patients: Patient[]) => localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients)),
  getPatients: (): Patient[] => {
    try {
      const p = localStorage.getItem(KEYS.PATIENTS);
      return p ? JSON.parse(p) : [];
    } catch (e) { return []; }
  },

  saveGlobalDocs: (docs: any[]) => localStorage.setItem(KEYS.GLOBAL_DOCS, JSON.stringify(docs)),
  getGlobalDocs: (): any[] => {
    try {
      const d = localStorage.getItem(KEYS.GLOBAL_DOCS);
      return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
  },

  saveCustomStudies: (studies: MedicalStudy[]) => localStorage.setItem(KEYS.CUSTOM_STUDIES, JSON.stringify(studies)),
  getCustomStudies: (): MedicalStudy[] => {
    try {
      const s = localStorage.getItem(KEYS.CUSTOM_STUDIES);
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
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
    try {
      const logs = localStorage.getItem(KEYS.AUDIT_LOGS);
      return logs ? JSON.parse(logs) : [];
    } catch (e) { return []; }
  },

  logAudit: (action: string, severity: 'low' | 'medium' | 'high', resourceId?: string) => {
    const doctor = StorageService.getDoctor();
    const logs = StorageService.getAuditLogs();
    const newEntry: AuditEntry = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36),
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
