
import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft, AlertCircle, Activity, Heart, Scale, TrendingUp, Plus, Hash, Clock, ShieldCheck, Download, Calendar, Bell, Trash } from 'lucide-react';
import { Patient, Doctor, HealthDocument, VitalEntry, Appointment } from '../types';
import DocumentManager from './DocumentManager';
import { generateUUID } from '../utils/uuid';

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
      </div>
    </div>
  );
};

const PatientManager: React.FC<PatientManagerProps> = ({ patients = [], setPatients, doctor }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ date: '', time: '', reason: '' });
  
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
      vitalsHistory: [{ timestamp: Date.now(), bmi: 24.5, bp: '120/80', hr: 72 }],
      appointments: []
    };
    setPatients([patient, ...patientList]);
    setShowAddForm(false);
    setNewPatient({ patientId: '', nomAnonymise: '', age: 45, sexe: 'M', antecedents: '', allergies: '' });
  };

  const exportPatientData = (patient: Patient) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patient, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dossier_${patient.nomAnonymise}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleAddAppointment = () => {
    if (!selectedPatientId || !newAppointment.date) return;
    const app: Appointment = {
      id: generateUUID(),
      ...newAppointment,
      status: 'scheduled'
    };
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, appointments: [...(p.appointments || []), app] } : p));
    setShowAppointmentForm(false);
    setNewAppointment({ date: '', time: '', reason: '' });
  };

  const removeAppointment = (appId: string) => {
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, appointments: p.appointments.filter(a => a.id !== appId) } : p));
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
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à la liste des dossiers
          </button>
          <button 
            onClick={() => exportPatientData(selectedPatient)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" /> Exporter Dossier Complet
          </button>
        </div>

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
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {selectedPatient.sexe} • {selectedPatient.age} ANS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prochains Rendez-vous */}
              <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-indigo-500" />
                     <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Rappels de Rendez-vous</h4>
                   </div>
                   <button 
                    onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                </div>

                {showAppointmentForm && (
                  <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="bg-white dark:bg-slate-900 border p-3 rounded-xl font-bold" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} />
                      <input type="time" className="bg-white dark:bg-slate-900 border p-3 rounded-xl font-bold" value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Motif (ex: Contrôle annuel)" className="w-full bg-white dark:bg-slate-900 border p-3 rounded-xl font-bold" value={newAppointment.reason} onChange={e => setNewAppointment({...newAppointment, reason: e.target.value})} />
                    <button onClick={handleAddAppointment} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs">Programmer</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedPatient.appointments?.map(app => (
                    <div key={app.id} className="p-4 bg-white dark:bg-slate-800 border rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                          <Bell className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">{app.reason || 'Consultation'}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{app.date} à {app.time}</p>
                        </div>
                      </div>
                      <button onClick={() => removeAppointment(app.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!selectedPatient.appointments || selectedPatient.appointments.length === 0) && (
                    <p className="text-xs text-slate-400 italic">Aucun rendez-vous programmé.</p>
                  )}
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                 <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                   <TrendingUp className="w-5 h-5 text-indigo-500" /> Suivi Clinique
                 </h4>
                 <VitalsChart data={selectedPatient.vitalsHistory || []} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5">
              <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-10 flex items-center gap-4">
                <ClipboardList className="w-6 h-6 text-indigo-600" /> Dossier Paraclinique
              </h4>
              <DocumentManager documents={selectedPatient.documents || []} setDocuments={updatePatientDocs} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Mesures</h4>
                <button onClick={() => setShowVitalForm(!showVitalForm)} className={`p-3 rounded-2xl ${showVitalForm ? 'bg-red-500' : 'bg-white/10'}`}>
                  {showVitalForm ? <Plus className="rotate-45" /> : <Plus />}
                </button>
              </div>
              {/* Vital Form & Display logic same as before but improved UI */}
              <div className="space-y-5">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                   <div className="flex items-center gap-4">
                     <Heart className="w-6 h-6 text-red-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tension</span>
                   </div>
                   <span className="font-black text-2xl text-emerald-400">{selectedPatient.vitalSigns?.bp || '—'}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Patient List UI as before */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">Gestion Patients</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Accès sécurisé aux dossiers médicaux partagés.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl"
        >
          <UserPlus className="w-7 h-7" /> Nouveau Dossier
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative group">
          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
          <input 
            type="text" 
            placeholder="Rechercher par identifiant patient, nom anonymisé..."
            className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-3xl outline-none font-black text-slate-700 dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map((patient) => (
          <div 
            key={patient.id} 
            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col relative"
            onClick={() => setSelectedPatientId(patient.id)}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.75rem] group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removePatient(patient.id); }}
                className="p-3 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
            
            <h4 className="font-black text-slate-800 dark:text-white text-2xl mb-1 tracking-tight truncate">{patient.nomAnonymise}</h4>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.sexe}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.age} ans</span>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase">
                <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> {patient.documents?.length || 0} docs</span>
                {patient.appointments?.length > 0 && <span className="flex items-center gap-1 text-indigo-500"><Calendar className="w-3.5 h-3.5" /> RDV</span>}
              </div>
              <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientManager;
