
import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft, AlertCircle, Activity, Heart, Scale, TrendingUp, Plus, Hash, Clock, ShieldCheck } from 'lucide-react';
import { Patient, Doctor, HealthDocument, VitalEntry } from '../types';
import DocumentManager from './DocumentManager';
import { generateUUID } from '../utils/uuid';

// Define the missing PatientManagerProps interface
interface PatientManagerProps {
  patients: Patient[];
  setPatients: (patients: Patient[] | ((prev: Patient[]) => Patient[])) => void;
  doctor: Doctor;
}

const VitalsChart: React.FC<{ data: VitalEntry[] }> = ({ data }) => {
  if (!data || data.length < 2) return (
    <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50">
      Données insuffisantes pour le suivi
    </div>
  );

  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp).slice(-15);
  const hrs = sortedData.map(d => d.hr || 0);
  const maxHR = Math.max(...hrs) + 10;
  const minHR = Math.max(0, Math.min(...hrs) - 10);
  const range = maxHR - minHR || 1;

  const getPoints = () => {
    return sortedData.map((d, i) => {
      const x = (i / (sortedData.length - 1)) * 100;
      const y = 100 - (((d.hr || 0) - minHR) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
  };

  const getAreaPoints = () => {
    const points = getPoints();
    return `${points} 100,100 0,100`;
  };

  return (
    <div className="space-y-4">
      <div className="h-48 w-full relative pt-4 px-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={getAreaPoints()} fill="url(#chartGradient)" />
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={getPoints()}
            className="drop-shadow-[0_4px_8px_rgba(99,102,241,0.4)]"
          />
          {sortedData.map((d, i) => (
            <circle
              key={i}
              cx={(i / (sortedData.length - 1)) * 100}
              cy={100 - (((d.hr || 0) - minHR) / range) * 100}
              r="1.5"
              fill="white"
              stroke="#6366f1"
              strokeWidth="1"
              className="cursor-help transition-all hover:r-3"
            >
              <title>{d.hr} bpm - {new Date(d.timestamp).toLocaleString()}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute top-0 left-0 text-[8px] font-black text-indigo-50/50 bg-white dark:bg-slate-900 px-1 rounded">MAX: {maxHR}</div>
        <div className="absolute bottom-0 left-0 text-[8px] font-black text-indigo-50/50 bg-white dark:bg-slate-900 px-1 rounded">MIN: {minHR}</div>
      </div>
      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-white/5 pt-3">
        <span>{new Date(sortedData[0].timestamp).toLocaleDateString()}</span>
        <span className="text-indigo-500">Évolution du Pouls (BPM)</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
};

const PatientManager: React.FC<PatientManagerProps> = ({ patients = [], setPatients, doctor }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [newVitals, setNewVitals] = useState<VitalEntry>({
    timestamp: Date.now(),
    bp: '120/80',
    hr: 72,
    bmi: 24.5
  });

  const [newPatient, setNewPatient] = useState({
    patientId: '',
    nomAnonymise: '',
    age: 45,
    sexe: 'M' as 'M' | 'F' | 'Autre',
    antecedents: '',
    allergies: ''
  });

  const patientList = Array.isArray(patients) ? patients : [];
  const selectedPatient = patientList.find(p => p.id === selectedPatientId);

  const handleAddPatient = () => {
    const patient: Patient = {
      id: generateUUID(),
      patientId: newPatient.patientId || `ID-${Math.floor(Math.random() * 100000)}`,
      nomAnonymise: newPatient.nomAnonymise || `PAT-${Math.floor(Math.random() * 10000)}`,
      age: newPatient.age,
      sexe: newPatient.sexe,
      antecedents: newPatient.antecedents,
      allergies: newPatient.allergies.split(',').map(s => s.trim()).filter(s => s !== ''),
      documents: [],
      consultations: [],
      vitalSigns: { timestamp: Date.now(), bmi: 24.5, bp: '120/80', hr: 72 },
      vitalsHistory: [{ timestamp: Date.now(), bmi: 24.5, bp: '120/80', hr: 72 }]
    };
    setPatients([patient, ...patientList]);
    setShowAddForm(false);
    setNewPatient({ patientId: '', nomAnonymise: '', age: 45, sexe: 'M', antecedents: '', allergies: '' });
  };

  const handleAddVitals = () => {
    if (!selectedPatientId) return;
    const vitalEntry = { ...newVitals, timestamp: Date.now() };
    setPatients(prevPatients => (prevPatients || []).map(p => {
      if (p.id === selectedPatientId) {
        return {
          ...p,
          vitalSigns: vitalEntry,
          vitalsHistory: [vitalEntry, ...(p.vitalsHistory || [])]
        };
      }
      return p;
    }));
    setShowVitalForm(false);
  };

  const removePatient = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce dossier patient ?")) {
      setPatients(patientList.filter(p => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
    }
  };

  const updatePatientDocs = (docsOrFn: HealthDocument[] | ((prev: HealthDocument[]) => HealthDocument[])) => {
    if (!selectedPatientId) return;
    setPatients(prevPatients => (prevPatients || []).map(p => {
      if (p.id === selectedPatientId) {
        const nextDocs = typeof docsOrFn === 'function' ? docsOrFn(p.documents || []) : docsOrFn;
        return { ...p, documents: nextDocs };
      }
      return p;
    }));
  };

  const filteredPatients = patientList.filter(p => 
    (p.nomAnonymise || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.patientId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedPatientId(null)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à la liste des dossiers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                    <User className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">{selectedPatient.nomAnonymise}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/5">
                        {selectedPatient.sexe} • {selectedPatient.age} ANS
                      </span>
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/10">
                        ID: {selectedPatient.patientId}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                  <div className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20 animate-pulse shadow-sm shadow-red-500/10">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">ALERTE ALLERGIES</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-7 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4">Antécédents & Comorbidités</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{selectedPatient.antecedents || "Aucun antécédent majeur renseigné."}</p>
                </div>
                <div className="p-7 bg-red-50/20 dark:bg-red-900/10 rounded-[2rem] border border-red-50 dark:border-red-500/10 shadow-sm">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] block mb-4">Allergies Critiques</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a, i) => (
                      <span key={i} className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm">{a}</span>
                    )) : <span className="text-xs text-slate-400 italic">Aucune allergie connue</span>}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Suivi Longitudinale</h4>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pouls</span>
                      </div>
                    </div>
                 </div>
                 <VitalsChart data={selectedPatient.vitalsHistory || []} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                    <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Dossier Paraclinique & Imagerie</h4>
                </div>
              </div>
              <DocumentManager 
                documents={selectedPatient.documents || []} 
                setDocuments={updatePatientDocs} 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 flex flex-col shadow-2xl shadow-indigo-900/20 border border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Constantes Actuelles</h4>
                <button 
                  onClick={() => setShowVitalForm(!showVitalForm)}
                  className={`p-3 rounded-2xl transition-all ${showVitalForm ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                >
                  {showVitalForm ? <Plus className="w-5 h-5 rotate-45 transition-transform" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showVitalForm ? (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Pression Art.</label>
                       <input 
                        type="text" 
                        placeholder="120/80"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                        value={newVitals.bp}
                        onChange={e => setNewVitals({...newVitals, bp: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Pouls (BPM)</label>
                       <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={newVitals.hr}
                        onChange={e => setNewVitals({...newVitals, hr: parseInt(e.target.value)})}
                       />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">IMC / BMI</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={newVitals.bmi}
                      onChange={e => setNewVitals({...newVitals, bmi: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button 
                    onClick={handleAddVitals}
                    className="w-full py-5 bg-indigo-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    Enregistrer mesures
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                   <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-red-500/20 rounded-2xl text-red-400">
                         <Heart className="w-6 h-6" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pression</span>
                     </div>
                     <span className="font-black text-2xl text-emerald-400 tabular-nums">{selectedPatient.vitalSigns?.bp || '—'}</span>
                   </div>
                   <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                         <Activity className="w-6 h-6" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pouls</span>
                     </div>
                     <span className="font-black text-2xl tabular-nums">{selectedPatient.vitalSigns?.hr || '—'} <span className="text-xs text-slate-600">bpm</span></span>
                   </div>
                   <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                         <Scale className="w-6 h-6" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-400">IMC</span>
                     </div>
                     <span className="font-black text-2xl tabular-nums">{selectedPatient.vitalSigns?.bmi || '—'}</span>
                   </div>
                </div>
              )}
              
              <div className="mt-4 p-5 bg-indigo-600/20 rounded-2xl border border-indigo-500/20">
                 <div className="flex items-center gap-3 mb-3">
                   {/* Fix: Added missing ShieldCheck import from lucide-react */}
                   <ShieldCheck className="w-4 h-4 text-indigo-400" />
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">IA Clinical Context</span>
                 </div>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                   Dernière analyse contextuelle effectuée le {new Date().toLocaleDateString()}. Gemini est informé des antécédents et allergies.
                 </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Historique des Saisies</h4>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {selectedPatient.vitalsHistory?.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] font-black tabular-nums">
                      <span className="text-emerald-500">{entry.bp}</span>
                      <span className="text-indigo-500">{entry.hr} bpm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">Gestion Patients</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1 italic">Accès sécurisé aux dossiers médicaux partagés (DMP-IA).</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 text-lg"
        >
          <UserPlus className="w-7 h-7" /> Nouveau Dossier
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative group">
          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher par identifiant patient, nom anonymisé ou pathologie..."
            className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-3xl outline-none font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all border border-transparent focus:border-indigo-500/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-12">
            <h4 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
              <PlusCircle className="w-10 h-10 text-indigo-500" /> Création de Dossier Clinique
            </h4>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              {/* Fix: Added missing ShieldCheck import from lucide-react */}
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Anonymisation Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identifiant Professionnel (RPPS/Local)</label>
              <div className="relative">
                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Ex: P-2024-889"
                  className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-slate-800 dark:text-white transition-all"
                  value={newPatient.patientId}
                  onChange={e => setNewPatient({...newPatient, patientId: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Pseudonyme / Initiales</label>
              <input 
                type="text" 
                placeholder="Ex: Patient Sarah M."
                className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-slate-800 dark:text-white transition-all"
                value={newPatient.nomAnonymise}
                onChange={e => setNewPatient({...newPatient, nomAnonymise: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Âge Réel</label>
                <input 
                  type="number" 
                  className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] outline-none font-black text-slate-800 dark:text-white transition-all"
                  value={newPatient.age}
                  onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sexe Bio.</label>
                <select 
                  className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] outline-none font-black text-slate-800 dark:text-white appearance-none cursor-pointer"
                  value={newPatient.sexe}
                  onChange={e => setNewPatient({...newPatient, sexe: e.target.value as any})}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div className="col-span-full space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Terrain Allergique (Comma separated)</label>
              <input 
                type="text" 
                placeholder="Ex: Pénicilline, Arachides, Iode..."
                className="w-full px-7 py-5 bg-red-50/30 dark:bg-red-950/20 border border-red-100 dark:border-red-500/10 rounded-[1.75rem] outline-none font-black text-slate-800 dark:text-white"
                value={newPatient.allergies}
                onChange={e => setNewPatient({...newPatient, allergies: e.target.value})}
              />
            </div>
            <div className="col-span-full space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Antécédents majeurs & Observations</label>
              <textarea 
                placeholder="Ex: HTA stabilisée, Diabète T2, Chirurgie cardiaque 2019..."
                className="w-full px-7 py-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[2rem] h-40 outline-none font-bold text-slate-800 dark:text-white leading-relaxed"
                value={newPatient.antecedents}
                onChange={e => setNewPatient({...newPatient, antecedents: e.target.value})}
              ></textarea>
            </div>
          </div>
          <div className="mt-14 flex justify-end gap-6">
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-10 py-5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={handleAddPatient}
              className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[1.75rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest text-sm"
            >
              Créer Dossier Médical
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map((patient) => (
          <div 
            key={patient.id} 
            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            onClick={() => setSelectedPatientId(patient.id)}
          >
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="absolute top-0 right-0 p-5">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              </div>
            )}
            <div className="flex justify-between items-start mb-8">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.75rem] group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removePatient(patient.id); }}
                className="p-3 text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-2 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5">
                {patient.patientId}
              </span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-2xl mb-1 tracking-tight truncate">{patient.nomAnonymise}</h4>
            
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.sexe}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.age} ans</span>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{patient.documents?.length || 0} docs</span>
                </div>
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] font-black text-red-500 uppercase">Alerte</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        ))}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white/50 dark:bg-slate-900/30 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-white/5">
             <User className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun dossier patient correspondant</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManager;
