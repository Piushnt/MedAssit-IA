import React, { useState } from 'react';
import { UserPlus, User, Trash2, ChevronRight, ClipboardList, PlusCircle, ArrowLeft, AlertCircle, Activity, Heart, Scale, TrendingUp, Plus, Hash, Clock, ShieldCheck, Download, Calendar, Bell } from 'lucide-react';
import { Patient, Doctor, HealthDocument, VitalEntry, Appointment } from '../types';
import DocumentManager from './DocumentManager';
import { generateUUID } from '../utils/uuid';

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
      vitalsHistory: [{ ...newVitals }],
      appointments: []
    };
    setPatients([patient, ...patientList]);
    setShowAddForm(false);
    setNewPatient({ patientId: '', nomAnonymise: '', age: 45, sexe: 'M', antecedents: '', allergies: '' });
  };

  const handleExportPatient = (p: Patient) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `dossier_${p.nomAnonymise}.json`);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleAddVitals = () => {
    if (!selectedPatientId) return;
    const entry = { ...newVitals, timestamp: Date.now() };
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, vitalSigns: entry, vitalsHistory: [entry, ...p.vitalsHistory] } : p));
    setShowVitalForm(false);
  };

  const handleAddAppointment = () => {
    if (!selectedPatientId || !newAppt.date) return;
    const appt: Appointment = { id: generateUUID(), ...newAppt, status: 'scheduled' };
    setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, appointments: [appt, ...(p.appointments || [])] } : p));
    setShowApptForm(false);
    setNewAppt({ date: '', time: '', reason: '' });
  };

  const filteredPatients = patientList.filter(p => 
    p.nomAnonymise.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedPatientId(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={() => handleExportPatient(selectedPatient)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
            <Download className="w-4 h-4" /> Exporter JSON
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center">
                    <User className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">{selectedPatient.nomAnonymise}</h3>
                    <div className="flex gap-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase">{selectedPatient.sexe} • {selectedPatient.age} ANS</span>
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[10px] font-black text-indigo-600 uppercase">ID: {selectedPatient.patientId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Antécédents</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{selectedPatient.antecedents || "Aucun renseigné."}</p>
                </div>
                <div className="p-6 bg-red-50/20 dark:bg-red-950/20 rounded-3xl border border-red-100/50 dark:border-red-500/10">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-3">Allergies Critiques</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">{a}</span>
                    )) : <span className="text-xs text-slate-400 italic">Aucune.</span>}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                   <Calendar className="w-5 h-5 text-indigo-500" /> Rappels de Rendez-vous
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedPatient.appointments?.map(app => (
                    <div key={app.id} className="p-4 bg-white dark:bg-slate-800 border rounded-2xl flex items-center justify-between group border-l-4 border-l-indigo-500">
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-white">{app.reason}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{app.date} à {app.time}</p>
                      </div>
                      <Bell className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  ))}
                  <button onClick={() => setShowApptForm(true)} className="p-4 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all text-xs font-bold uppercase">
                    <Plus className="w-4 h-4" /> Programmer RDV
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5">
              <DocumentManager documents={selectedPatient.documents || []} setDocuments={(docsOrFn) => {
                setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, documents: typeof docsOrFn === 'function' ? docsOrFn(p.documents) : docsOrFn } : p));
              }} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5"><Activity className="w-32 h-32" /></div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Constantes Actuelles</h4>
                <button onClick={() => setShowVitalForm(!showVitalForm)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><Plus className="w-5 h-5" /></button>
              </div>

              {showVitalForm ? (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <input type="text" placeholder="BP 120/80" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold" value={newVitals.bp} onChange={e => setNewVitals({...newVitals, bp: e.target.value})} />
                  <input type="number" placeholder="HR 72" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-bold" value={newVitals.hr} onChange={e => setNewVitals({...newVitals, hr: parseInt(e.target.value)})} />
                  <button onClick={handleAddVitals} className="w-full py-4 bg-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="font-black text-xl text-emerald-400">{selectedPatient.vitalSigns?.bp || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <span className="font-black text-xl">{selectedPatient.vitalSigns?.hr || '—'} bpm</span>
                  </div>
                </div>
              )}
            </div>

            {showApptForm && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl animate-in fade-in">
                 <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-6">Nouveau RDV</h4>
                 <div className="space-y-4">
                   <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-white/5 font-bold" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                   <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-white/5 font-bold" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                   <input type="text" placeholder="Motif..." className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-white/5 font-bold" value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} />
                   <button onClick={handleAddAppointment} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest">Confirmer</button>
                 </div>
              </div>
            )}
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
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestion sécurisée des dossiers médicaux locaux.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
          <UserPlus className="w-6 h-6" /> Nouveau Dossier
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative">
          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input type="text" placeholder="Rechercher un identifiant ou nom..." className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map(p => (
          <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col relative overflow-hidden">
            {p.allergies.length > 0 && <div className="absolute top-0 right-0 p-6"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div></div>}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all"><User className="w-7 h-7" /></div>
            <h4 className="font-black text-slate-800 dark:text-white text-xl mb-1">{p.nomAnonymise}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{p.sexe} • {p.age} ANS • {p.patientId}</p>
            <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5" /> {p.documents.length} Docs</span>
              <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl border border-white/10 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8">Nouveau Dossier Patient</h3>
             <div className="grid grid-cols-2 gap-6 mb-8">
               <input type="text" placeholder="ID (ex: PAT-01)" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border font-bold" value={newPatient.patientId} onChange={e => setNewPatient({...newPatient, patientId: e.target.value})} />
               <input type="text" placeholder="Nom Anonymisé" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border font-bold" value={newPatient.nomAnonymise} onChange={e => setNewPatient({...newPatient, nomAnonymise: e.target.value})} />
               <input type="number" placeholder="Age" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border font-bold" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})} />
               <select className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border font-bold" value={newPatient.sexe} onChange={e => setNewPatient({...newPatient, sexe: e.target.value as any})}>
                 <option value="M">Masculin</option>
                 <option value="F">Féminin</option>
                 <option value="Autre">Autre</option>
               </select>
               <input type="text" placeholder="Allergies (séparées par ,)" className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border font-bold" value={newPatient.allergies} onChange={e => setNewPatient({...newPatient, allergies: e.target.value})} />
             </div>
             <div className="flex justify-end gap-4">
               <button onClick={() => setShowAddForm(false)} className="px-6 py-3 font-bold text-slate-400">Annuler</button>
               <button onClick={handleAddPatient} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-sm">Créer le dossier</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientManager;