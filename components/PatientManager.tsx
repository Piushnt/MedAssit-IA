
import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft, AlertCircle, Activity, Heart, Scale } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [newPatient, setNewPatient] = useState({
    nomAnonymise: '',
    age: 45,
    sexe: 'M' as 'M' | 'F' | 'Autre',
    antecedents: '',
    allergies: ''
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddPatient = () => {
    const patient: Patient = {
      id: crypto.randomUUID(),
      nomAnonymise: newPatient.nomAnonymise || `PAT-${Math.floor(Math.random() * 10000)}`,
      age: newPatient.age,
      sexe: newPatient.sexe,
      antecedents: newPatient.antecedents,
      allergies: newPatient.allergies.split(',').map(s => s.trim()).filter(s => s !== ''),
      documents: [],
      consultations: [],
      vitalSigns: { bmi: 24.5, bp: '120/80', hr: 72 } // Mocked initial data
    };
    setPatients([patient, ...patients]);
    setShowAddForm(false);
    setNewPatient({ nomAnonymise: '', age: 45, sexe: 'M', antecedents: '', allergies: '' });
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

  const filteredPatients = patients.filter(p => 
    p.nomAnonymise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedPatientId(null)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        {/* Profile Card with Data Vis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{selectedPatient.nomAnonymise}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                    {selectedPatient.sexe} • {selectedPatient.age} ANS • ID: {selectedPatient.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              {selectedPatient.allergies.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/10 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alerte Allergies</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Antécédents</span>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{selectedPatient.antecedents || "R.A.S"}</p>
              </div>
              <div className="p-6 bg-red-50/30 dark:bg-red-900/10 rounded-3xl border border-red-50 dark:border-red-500/10">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] block mb-3">Allergies connues</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a, i) => (
                    <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold">{a}</span>
                  )) : <span className="text-xs text-slate-400">Aucune allergie déclarée</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Indicateurs de Santé</h4>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Heart className="w-5 h-5 text-red-400" />
                   <span className="text-xs font-bold">Pression Art.</span>
                 </div>
                 <span className="font-black text-lg text-emerald-400">{selectedPatient.vitalSigns?.bp}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Activity className="w-5 h-5 text-indigo-400" />
                   <span className="text-xs font-bold">Pouls (repos)</span>
                 </div>
                 <span className="font-black text-lg">{selectedPatient.vitalSigns?.hr} bpm</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Scale className="w-5 h-5 text-amber-400" />
                   <span className="text-xs font-bold">IMC</span>
                 </div>
                 <span className="font-black text-lg">{selectedPatient.vitalSigns?.bmi}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white tracking-tight">Dossier Paraclinique</h4>
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Base Patientèle</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez et accédez aux dossiers cliniques sécurisés.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <UserPlus className="w-6 h-6" /> Nouveau Patient
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un dossier par identifiant..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-700 dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl animate-in zoom-in-95 duration-300">
          <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
            <PlusCircle className="w-8 h-8 text-indigo-500" /> Initialisation d'un Dossier
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant Patient</label>
              <input 
                type="text" 
                placeholder="Ex: PAT-24-001"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 dark:text-white"
                value={newPatient.nomAnonymise}
                onChange={e => setNewPatient({...newPatient, nomAnonymise: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Âge</label>
                <input 
                  type="number" 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none font-bold text-slate-800 dark:text-white"
                  value={newPatient.age}
                  onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sexe</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none font-bold text-slate-800 dark:text-white appearance-none"
                  value={newPatient.sexe}
                  onChange={e => setNewPatient({...newPatient, sexe: e.target.value as any})}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div className="col-span-full space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Allergies (séparées par des virgules)</label>
              <input 
                type="text" 
                placeholder="Pénicilline, Arachides, Pollen..."
                className="w-full px-6 py-4 bg-red-50/30 dark:bg-red-900/10 border border-red-100/50 dark:border-red-500/10 rounded-2xl outline-none font-bold text-slate-800 dark:text-white"
                value={newPatient.allergies}
                onChange={e => setNewPatient({...newPatient, allergies: e.target.value})}
              />
            </div>
            <div className="col-span-full space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Antécédents majeurs</label>
              <textarea 
                placeholder="HTA, Diabète, etc..."
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl h-32 outline-none font-bold text-slate-800 dark:text-white"
                value={newPatient.antecedents}
                onChange={e => setNewPatient({...newPatient, antecedents: e.target.value})}
              ></textarea>
            </div>
          </div>
          <div className="mt-10 flex justify-end gap-6">
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-8 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={handleAddPatient}
              className="px-10 py-4 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Enregistrer Dossier
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map((patient) => (
          <div 
            key={patient.id} 
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            onClick={() => setSelectedPatientId(patient.id)}
          >
            {patient.allergies.length > 0 && (
              <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.5rem] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <User className="w-7 h-7" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removePatient(patient.id); }}
                className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-xl mb-1">{patient.nomAnonymise}</h4>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-400">{patient.sexe}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="text-xs font-bold text-slate-400">{patient.age} ans</span>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{patient.documents.length}</span>
                </div>
                {patient.allergies.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] font-black text-red-500 uppercase">Alert</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientManager;
