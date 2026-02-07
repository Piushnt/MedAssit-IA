
import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft } from 'lucide-react';
import { Patient, Doctor, HealthDocument } from '../types';
import DocumentManager from './DocumentManager';

interface PatientManagerProps {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  doctor: Doctor;
}

const PatientManager: React.FC<PatientManagerProps> = ({ patients, setPatients, doctor }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    nomAnonymise: '',
    age: 45,
    sexe: 'M' as 'M' | 'F' | 'Autre',
    antecedents: ''
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddPatient = () => {
    const patient: Patient = {
      id: crypto.randomUUID(),
      nomAnonymise: newPatient.nomAnonymise || `PAT-${Math.floor(Math.random() * 10000)}`,
      age: newPatient.age,
      sexe: newPatient.sexe,
      antecedents: newPatient.antecedents,
      documents: [],
      consultations: []
    };
    setPatients([patient, ...patients]);
    setShowAddForm(false);
    setNewPatient({ nomAnonymise: '', age: 45, sexe: 'M', antecedents: '' });
  };

  const removePatient = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce dossier patient ?")) {
      setPatients(patients.filter(p => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
    }
  };

  const updatePatientDocs = (docs: HealthDocument[]) => {
    if (!selectedPatientId) return;
    setPatients(patients.map(p => 
      p.id === selectedPatientId ? { ...p, documents: docs } : p
    ));
  };

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedPatientId(null)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedPatient.nomAnonymise}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedPatient.sexe} • {selectedPatient.age} ans • {selectedPatient.documents.length} documents
              </p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Antécédents</span>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{selectedPatient.antecedents || "Aucun antécédent majeur"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-slate-800 dark:text-white">Documents du Patient</h4>
          </div>
          <DocumentManager 
            documents={selectedPatient.documents} 
            setDocuments={updatePatientDocs} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Patients</h3>
          <p className="text-slate-500 dark:text-slate-400">Gérez les dossiers cliniques de votre patientèle.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <UserPlus className="w-5 h-5" /> Nouveau Patient
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-500" /> Créer un nouveau dossier
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Identifiant / Nom Anonymisé</label>
              <input 
                type="text" 
                placeholder="Ex: PAT-2024-001"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                value={newPatient.nomAnonymise}
                onChange={e => setNewPatient({...newPatient, nomAnonymise: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Âge</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                  value={newPatient.age}
                  onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Sexe</label>
                <select 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                  value={newPatient.sexe}
                  onChange={e => setNewPatient({...newPatient, sexe: e.target.value as any})}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Antécédents majeurs</label>
              <textarea 
                placeholder="Ex: HTA, Diabète Type 2, Insuffisance rénale..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                value={newPatient.antecedents}
                onChange={e => setNewPatient({...newPatient, antecedents: e.target.value})}
              ></textarea>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleAddPatient}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              Créer le dossier
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div 
            key={patient.id} 
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md dark:hover:border-indigo-500/30 transition-all cursor-pointer group flex flex-col"
            onClick={() => setSelectedPatientId(patient.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removePatient(patient.id); }}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{patient.nomAnonymise}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {patient.sexe} • {patient.age} ans
            </p>
            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  {patient.documents.length} Docs
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-200 dark:text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
        {patients.length === 0 && !showAddForm && (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <User className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium">Aucun patient dans votre base.</p>
            <p className="text-sm opacity-60">Commencez par créer un nouveau dossier.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManager;
