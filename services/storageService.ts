
import { Patient, Doctor, AdviceLog, AuditEntry, MedicalStudy } from '../types';

const KEYS = {
  DOCTORS: 'med_pro_accounts', // Liste de tous les comptes
  SESSION_ID: 'med_pro_session_id', // ID du docteur connecté
  PATIENTS: 'med_pro_patients',
  GLOBAL_DOCS: 'med_global_docs',
  AUDIT_LOGS: 'med_audit_logs',
  CUSTOM_STUDIES: 'med_custom_studies'
};

export const StorageService = {
  // Gestion des comptes Docteurs
  signup: (doctor: Doctor) => {
    const doctors = StorageService.getAllDoctors();
    if (doctors.find(d => d.email === doctor.email)) {
      throw new Error("Cet email est déjà utilisé.");
    }
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify([...doctors, doctor]));
    StorageService.setCurrentDoctorId(doctor.id);
    StorageService.logAudit('Création de compte Praticien', 'medium', doctor.id);
  },

  login: (name: string, password: string): Doctor | null => {
    const doctors = StorageService.getAllDoctors();
    const found = doctors.find(d => d.name === name && d.password === password);
    if (found) {
      StorageService.setCurrentDoctorId(found.id);
      StorageService.logAudit('Connexion Praticien', 'low', found.id);
      return found;
    }
    return null;
  },

  getAllDoctors: (): Doctor[] => {
    try {
      const d = localStorage.getItem(KEYS.DOCTORS);
      return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
  },

  setCurrentDoctorId: (id: string) => localStorage.setItem(KEYS.SESSION_ID, id),
  
  getDoctor: (): Doctor | null => {
    try {
      const sessionId = localStorage.getItem(KEYS.SESSION_ID);
      if (!sessionId) return null;
      const doctors = StorageService.getAllDoctors();
      return doctors.find(d => d.id === sessionId) || null;
    } catch (e) { return null; }
  },
  
  // Gestion des Patients (filtrés par Docteur)
  savePatients: (patients: Patient[]) => {
    const doctor = StorageService.getDoctor();
    if (!doctor) return;

    // On récupère tous les patients de tous les docteurs
    const allStoredPatients = StorageService.getAllPatientsRaw();
    // On filtre ceux qui n'appartiennent pas au docteur actuel
    const otherPatients = allStoredPatients.filter(p => p.doctorId !== doctor.id);
    // On fusionne avec les patients mis à jour du docteur actuel
    const updatedAll = [...otherPatients, ...patients.map(p => ({ ...p, doctorId: doctor.id }))];
    
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(updatedAll));
  },

  getAllPatientsRaw: (): Patient[] => {
    try {
      const p = localStorage.getItem(KEYS.PATIENTS);
      return p ? JSON.parse(p) : [];
    } catch (e) { return []; }
  },

  getPatients: (): Patient[] => {
    const doctor = StorageService.getDoctor();
    if (!doctor) return [];
    const all = StorageService.getAllPatientsRaw();
    return all.filter(p => p.doctorId === doctor.id);
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
    const doctor = StorageService.getDoctor();
    if (!doctor) return;
    
    const ps = StorageService.getPatients();
    const newPatient = { ...patient, doctorId: doctor.id };
    StorageService.savePatients([newPatient, ...ps]);
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
    localStorage.removeItem(KEYS.SESSION_ID);
  },

  clearAll: () => {
    localStorage.clear();
  }
};
