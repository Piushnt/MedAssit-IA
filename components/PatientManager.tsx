
import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft, AlertCircle, Activity, Heart, Scale, TrendingUp, Plus, Hash, Clock, ShieldCheck, Download, Calendar, Bell, Trash } from 'lucide-react';
import { Patient, Doctor, HealthDocument, VitalEntry, Appointment } from '../types';
import DocumentManager from './DocumentManager';
import { generateUUID } from '../utils/uuid';

const AppointmentsTimeline: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  if (!appointments || appointments.length === 0) return (
    <div className="mb-8 p-10 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center opacity-40">
      <Clock className="w-10 h-10 mb-3 text-slate-300" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun historique de planification</p>
    </div>
  );

  const sorted = [...appointments]
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  return (
    <div className="mb-10 px-8 py-8 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-white/5 relative overflow-hidden group/timeline">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500/20"></div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none">Progression des Soins</h5>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Timeline chronologique des sessions</p>
        </div>
      </div>
      
      <div className="relative pt-4 pb-2">
        {/* Connecting Line */}
        <div className="absolute top-[31px] left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800"></div>
        
        <div className="flex items-start gap-0 relative overflow-x-auto pb-4 custom-scrollbar">
          {sorted.map((app, idx) => {
            const isPast = new Date(app.date).getTime() < Date.now();
            return (
              <div key={app.id} className="flex flex-col items-center min-w-[140px] group cursor-default">
                {/* Node */}
                <div className={`w-5 h-5 rounded-full border-4 z-10 transition-all duration-500 group-hover:scale-125 mb-4 ${
                  isPast 
                  ? 'bg-slate-300 border-white dark:border-slate-900 shadow-sm' 
                  : 'bg-indigo-600 border-indigo-100 dark:border-indigo-900 shadow-xl shadow-indigo-500/40'
                }`}></div>
                
                <div className="text-center px-2">
                  <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase truncate w-full mb-1 group-hover:text-indigo-500 transition-colors">{app.reason || 'Consultation'}</p>
                  <p className={`text-[9px] font-black uppercase tracking-tighter ${isPast ? 'text-slate-400' : 'text-indigo-500'}`}>
                    {new Date(app.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{app.time || '--:--'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-white/5 pt-3">
        <span>{new Date(sortedData[0].timestamp).toLocaleDateString()}</span>
        <span className="text-indigo-500">Évolution du Pouls (BPM)</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
};

interface PatientManagerProps {
  patients: Patient[];
  setPatients: (patients: Patient[] | ((prev: Patient[]) => Patient[])) => void;
  doctor: Doctor;
}

const PatientManager: React.FC<PatientManagerProps> = ({ patients = [], setPatients, doctor }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);
  
  const [newVitals, setNewVitals] = useState<VitalEntry>({ timestamp: Date.now(), bp: '120/80', hr: 72, bmi: 24.5 });
  const [newAppt, setNewAppt] = useState({ date: '', time: '', reason: '' });
  const [newPatient, setNewPatient] = useState({ patientId: '', nomAnonymise: '', age: 45, sexe: 'M' as 'M' | 'F' | 'Autre', antecedents: '', allergies: '' });

  const patientList = Array.isArray(patients) ? patients : [];
  const selectedPatient = patientList.find(p => p.id === selectedPatientId);

  const handleAddPatient = () => {
    const patient: Patient = {
      id: generateUUID(),
      patientId: newPatient.patientId || `PAT-${Math.floor(Math.random() * 10000)}`,
      nomAnonymise: newPatient.nomAnonymise || "Anonyme",
      age: newPatient.age,
      sexe: newPatient.sexe,
      antecedents: newPatient.antecedents,
      allergies: newPatient.allergies.split(',').map(s => s.trim()).filter(s => s !== ''),
      documents: [],
      consultations: [],
      vitalSigns: { ...newVitals },
      vitalsHistory: [{ ...newVitals }],
      appointments: [],
      doctorId: doctor.id // Indique le docteur qui suit le patient
    };
    setPatients([patient, ...patientList]);
    setShowAddForm(false);
    setNewPatient({ patientId: '', nomAnonymise: '', age: 45, sexe: 'M', antecedents: '', allergies: '' });
  };

  const handleExportPatient = (p: Patient) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `dossier_${p.nomAnonymise}_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleAddVitals = () => {
    if (!selectedPatientId) return;
    const entry = { ...newVitals, timestamp: Date.now() };
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, vitalSigns: entry, vitalsHistory: [entry, ...(p.vitalsHistory || [])] } : p));
    setShowVitalForm(false);
  };

  const handleAddAppointment = () => {
    if (!selectedPatientId || !newAppt.date) return;
    const appt: Appointment = { id: generateUUID(), ...newAppt, status: 'scheduled' };
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, appointments: [appt, ...(p.appointments || [])] } : p));
    setShowApptForm(false);
    setNewAppt({ date: '', time: '', reason: '' });
  };

  const removePatient = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce dossier patient ?")) {
      setPatients(patientList.filter(p => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
    }
  };

  const removeAppointment = (appId: string) => {
    if (!selectedPatientId) return;
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, appointments: p.appointments.filter(a => a.id !== appId) } : p));
  };

  const filteredPatients = patientList.filter(p => 
    (p.nomAnonymise || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.patientId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedPatientId(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à la liste
          </button>
          <button onClick={() => handleExportPatient(selectedPatient)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
            <Download className="w-4 h-4" /> Exporter Dossier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20 shadow-inner">
                    <User className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">{selectedPatient.nomAnonymise}</h3>
                    <div className="flex gap-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{selectedPatient.sexe} • {selectedPatient.age} ANS</span>
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">ID: {selectedPatient.patientId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                    <span className="text-[10px] font-black uppercase">Suivi par : Dr. {doctor.name}</span>
                  </div>
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/10">
                      <AlertCircle className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase">Alerte Allergies</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Antécédents</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{selectedPatient.antecedents || "Aucun renseigné."}</p>
                </div>
                <div className="p-6 bg-red-50/20 dark:bg-red-950/20 rounded-3xl border border-red-100/50 dark:border-red-500/10">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-3">Terrain Allergique</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-[10px] font-black uppercase tracking-wide">{a}</span>
                    )) : <span className="text-xs text-slate-400 italic">Aucune.</span>}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-indigo-500" /> Planification Thérapeutique
                   </h4>
                   <button onClick={() => setShowApptForm(!showApptForm)} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                    <Plus className="w-5 h-5" />
                   </button>
                </div>

                <AppointmentsTimeline appointments={selectedPatient.appointments || []} />

                {showApptForm && (
                  <div className="mb-8 p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-white/5 animate-in slide-in-from-top-4 space-y-6 shadow-inner relative">
                    <button onClick={() => setShowApptForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"><Plus className="w-5 h-5 rotate-45" /></button>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Date du RDV</label>
                        <input type="date" className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Heure</label>
                        <input type="time" className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Motif Clinique</label>
                      <input type="text" placeholder="Ex: Contrôle post-opératoire, Suivi tension..." className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} />
                    </div>
                    <button onClick={handleAddAppointment} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">Enregistrer le rendez-vous</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedPatient.appointments?.map(app => (
                    <div key={app.id} className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[2.25rem] flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{app.reason || 'Consultation'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{app.date} • {app.time}</p>
                        </div>
                      </div>
                      <button onClick={() => removeAppointment(app.id)} className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-red-500 transition-all bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-white/5">
              <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-10 flex items-center gap-4">
                <ClipboardList className="w-6 h-6 text-indigo-600" /> Dossier Paraclinique
              </h4>
              <DocumentManager documents={selectedPatient.documents || []} setDocuments={(docsOrFn) => {
                setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, documents: typeof docsOrFn === 'function' ? docsOrFn(p.documents) : docsOrFn } : p));
              }} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[3rem] text-white space-y-8 flex flex-col shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 p-10 opacity-5"><Activity className="w-32 h-32" /></div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Suivi Clinique</h4>
                <button onClick={() => setShowVitalForm(!showVitalForm)} className={`p-2 rounded-xl transition-all ${showVitalForm ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {showVitalForm ? <Plus className="w-5 h-5 rotate-45" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showVitalForm ? (
                <div className="space-y-4 animate-in slide-in-from-top-4 relative z-10">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tension Art.</label>
                    <input type="text" placeholder="Ex: 120/80" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/40" value={newVitals.bp} onChange={e => setNewVitals({...newVitals, bp: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pouls (BPM)</label>
                    <input type="number" placeholder="Ex: 72" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/40" value={newVitals.hr} onChange={e => setNewVitals({...newVitals, hr: parseInt(e.target.value) || 0})} />
                  </div>
                  <button onClick={handleAddVitals} className="w-full py-4 bg-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Enregistrer</button>
                </div>
              ) : (
                <div className="space-y-5 relative z-10">
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-4">
                      <Heart className="w-6 h-6 text-red-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tension</span>
                    </div>
                    <span className="font-black text-2xl text-emerald-400 tabular-nums">{selectedPatient.vitalSigns?.bp || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-4">
                      <Activity className="w-6 h-6 text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pouls</span>
                    </div>
                    <span className="font-black text-2xl tabular-nums">{selectedPatient.vitalSigns?.hr || '—'} <span className="text-xs opacity-40">bpm</span></span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5">
                     <VitalsChart data={selectedPatient.vitalsHistory || []} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-indigo-600/10 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-500/20">
               <div className="flex items-center gap-3 mb-3">
                 <ShieldCheck className="w-4 h-4 text-indigo-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Sécurité des données</span>
               </div>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Ce dossier est chiffré localement. Seul votre certificat peut déchiffrer les rapports médicaux.</p>
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
          <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-2">Patients</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic">Gestion sécurisée des dossiers médicaux locaux.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-8 py-5 rounded-[1.75rem] font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 group">
          <UserPlus className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" /> Nouveau Dossier
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative group">
          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input type="text" placeholder="Rechercher un identifiant ou nom anonymisé..." className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all border border-transparent focus:border-indigo-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map(p => (
          <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col relative overflow-hidden">
            {p.allergies && p.allergies.length > 0 && (
              <div className="absolute top-0 right-0 p-6">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              </div>
            )}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-xl mb-1 tracking-tight">{p.nomAnonymise}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{p.sexe} • {p.age} ANS • {p.patientId}</p>
            
            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <div className="flex gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> {p.documents?.length || 0} Docs</span>
                {p.appointments?.length > 0 && (
                  <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> RDV</span>
                )}
              </div>
              <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1.5 transition-all" />
            </div>
          </div>
        ))}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-100/30 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
            <User className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
            <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">Aucun patient trouvé</h4>
            <p className="text-slate-400 font-medium italic mt-2">Affinez votre recherche ou créez un nouveau dossier.</p>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-12 rounded-[3.5rem] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Nouveau Dossier Patient</h3>
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                 <ShieldCheck className="w-6 h-6" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-6 mb-10">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Patient (RPPS/Local)</label>
                 <input type="text" placeholder="Ex: PAT-2024-01" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10" value={newPatient.patientId} onChange={e => setNewPatient({...newPatient, patientId: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pseudonyme / Initiales</label>
                 <input type="text" placeholder="Ex: Patient X" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10" value={newPatient.nomAnonymise} onChange={e => setNewPatient({...newPatient, nomAnonymise: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Âge</label>
                 <input type="number" placeholder="45" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value) || 0})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexe Biologique</label>
                 <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 font-bold outline-none appearance-none cursor-pointer" value={newPatient.sexe} onChange={e => setNewPatient({...newPatient, sexe: e.target.value as any})}>
                   <option value="M">Masculin</option>
                   <option value="F">Féminin</option>
                   <option value="Autre">Autre</option>
                 </select>
               </div>
               <div className="col-span-2 space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allergies connues (séparées par virgules)</label>
                 <input type="text" placeholder="Ex: Pénicilline, Iode..." className="w-full p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-500/10 font-bold outline-none focus:ring-4 focus:ring-red-500/10" value={newPatient.allergies} onChange={e => setNewPatient({...newPatient, allergies: e.target.value})} />
               </div>
               <div className="col-span-2 space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Antécédents & Observations</label>
                 <textarea placeholder="Ex: HTA stable sous traitement, Asthme infantile..." className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 h-32 leading-relaxed" value={newPatient.antecedents} onChange={e => setNewPatient({...newPatient, antecedents: e.target.value})} />
               </div>
             </div>
             <div className="flex justify-end gap-6">
               <button onClick={() => setShowAddForm(false)} className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annuler</button>
               <button onClick={handleAddPatient} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Créer le dossier médical</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientManager;
