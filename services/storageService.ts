
import { Patient, Doctor, AdviceLog } from '../types';

const KEYS = {
  DOCTOR: 'med_pro_profile',
  PATIENTS: 'med_pro_patients',
  GLOBAL_DOCS: 'med_global_docs'
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
    return updatedPatients;
  },

  logout: () => {
    localStorage.removeItem(KEYS.DOCTOR);
  },

  clearAll: () => {
    localStorage.removeItem(KEYS.DOCTOR);
    localStorage.removeItem(KEYS.PATIENTS);
    localStorage.removeItem(KEYS.GLOBAL_DOCS);
  }
};
