
import React, { useState, useEffect, useMemo } from 'react';
import { Send, Activity, Loader2, Sparkles, AlertTriangle, PhoneCall, BookOpen, UserCheck, Pill, Search, ExternalLink, ChevronRight, Bookmark, ShieldCheck } from 'lucide-react';
import { HealthDocument, AdviceLog, Doctor, Patient, MedicalStudy } from '../types';
import { traiterRequeteClinique, rechercherDirectivesSante } from '../services/analysisService';
import { generateUUID } from '../utils/uuid';

interface DashboardProps {
  doctor: Doctor;
  patients: Patient[];
  addLog: (patientId: string, log: AdviceLog) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  doctor, 
  patients, 
  addLog
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  
  const [medQuery, setMedQuery] = useState('');
  const [isSearchingMed, setIsSearchingMed] = useState(false);
  const [medResult, setMedResult] = useState<{text: string, sources: any[]} | null>(null);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);
  const documents = selectedPatient ? selectedPatient.documents : patients.flatMap(p => p.documents || []);
  const allergies = selectedPatient?.allergies || [];
  
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [localStudies, setLocalStudies] = useState<MedicalStudy[]>([]);

  useEffect(() => {
    fetch('/data/medical_database.json')
      .then(res => res.json())
      .then(data => setLocalStudies(data))
      .catch(err => console.error("Erreur base locale:", err));
  }, []);

  const handleSend = async (customPrompt?: string, isSummary: boolean = false) => {
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) return;

    if (!isSummary) setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: isSummary ? "Génération d'une synthèse clinique transversale..." : promptToSend }]);
    
    if (isSummary) setIsSummarizing(true);
    else setIsLoading(true);

    try {
      const sources = isExpertMode ? localStudies : [];
      const response = await traiterRequeteClinique(promptToSend, documents, isSummary, sources, allergies);
      
      const isUrgent = response.includes("⚠️") || response.toLowerCase().includes("urgent") || response.toLowerCase().includes("alerte");
      setShowEmergency(isUrgent);

      setChatHistory(prev => [...prev, { role: 'bot', text: response }]);

      if (selectedPatientId) {
        addLog(selectedPatientId, {
          id: generateUUID(),
          timestamp: Date.now(),
          query: promptToSend,
          response: response,
          sources: [...documents.map(d => d.name), ...(isExpertMode ? ["Base scientifique locale"] : [])]
        });
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "Erreur technique du moteur d'analyse clinique." }]);
    } finally {
      setIsLoading(false);
      setIsSummarizing(false);
    }
  };

  const handleMedSearch = async () => {
    if (!medQuery.trim()) return;
    setIsSearchingMed(true);
    setMedResult(null);
    try {
      const result = await rechercherDirectivesSante(`Fiche clinique détaillée : ${medQuery}. Classe thérapeutique, indications, posologies et contre-indications.`);
      setMedResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMed(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Dossier Actif</label>
            <select 
              value={selectedPatientId} 
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-transparent font-black text-slate-800 dark:text-white outline-none w-full cursor-pointer text-lg leading-tight"
            >
              <option value="">Sélectionner un dossier...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.patientId}] {p.nomAnonymise}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {allergies.length > 0 && (
          <div className="px-7 py-5 bg-red-50 dark:bg-red-950/40 rounded-[2rem] border border-red-100 dark:border-red-500/10 flex items-center gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Attention Allergies</span>
              <span className="text-sm font-black text-red-600 dark:text-red-300 truncate max-w-[200px]">{allergies.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col hover:shadow-xl transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
              <Pill className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight uppercase tracking-widest text-xs">Recherche Pharmacopée</h3>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="DCI ou nom commercial..."
                className="w-full pl-11 pr-5 py-4 text-sm bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-transparent focus:border-indigo-500/30 transition-all font-bold"
                value={medQuery}
                onChange={e => setMedQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMedSearch()}
              />
            </div>
            <button 
              onClick={handleMedSearch}
              disabled={isSearchingMed || !medQuery.trim()}
              className="px-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              {isSearchingMed ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button 
          onClick={() => handleSend("Réaliser une synthèse clinique transversale : croiser les documents avec les antécédents et les allergies.", true)}
          disabled={isSummarizing || documents.length === 0}
          className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/20 text-white flex items-center gap-6 hover:bg-emerald-600 transition-all group disabled:opacity-50 disabled:grayscale relative overflow-hidden"
        >
          <div className="bg-white/20 p-5 rounded-[1.75rem] group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-black text-xl tracking-tight">Analyse 360°</h3>
            <p className="text-emerald-50 text-xs mt-1 font-bold opacity-80 uppercase tracking-widest">Synthèse complète du dossier</p>
          </div>
        </button>
      </div>

      {medResult && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-6 duration-500 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                 <Bookmark className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Fiche Médicament : {medQuery}</h4>
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Source : Directives de santé</p>
               </div>
             </div>
             <button onClick={() => setMedResult(null)} className="text-slate-300 hover:text-red-500 transition-colors">
                Fermer
             </button>
           </div>
           
           <div className="prose prose-slate dark:prose-invert max-w-none">
             <div className="text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium border-l-4 border-indigo-500 pl-6 py-2">
               {medResult.text}
             </div>
           </div>
        </div>
      )}

      <div className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${
        isExpertMode 
        ? 'bg-indigo-600 text-white border-transparent shadow-2xl shadow-indigo-600/20 scale-[1.02]' 
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'
      }`}>
        <div className="flex items-center gap-5">
          <div className={`p-3.5 rounded-2xl transition-colors shadow-inner ${isExpertMode ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className={`text-lg font-black tracking-tight ${isExpertMode ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>Base Scientifique (Recherche Contextuelle)</h4>
            <p className={`text-xs font-medium ${isExpertMode ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>Indexation de {localStudies.length} publications cliniques.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsExpertMode(!isExpertMode)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
            isExpertMode ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
            isExpertMode ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {showEmergency && (
        <div className="bg-red-600 text-white p-6 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-top-6 flex items-center justify-between border-4 border-red-500/50">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-tight">Vigilance Clinique</p>
              <p className="text-sm font-bold opacity-90 leading-tight">Risque identifié dans le dossier.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-6 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-100 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest">
            <PhoneCall className="w-5 h-5" /> Aide d'urgence
          </button>
        </div>
      )}

      <div className={`bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border flex flex-col transition-all duration-700 overflow-hidden min-h-[500px] ${
        isExpertMode ? 'border-indigo-600/20 ring-[12px] ring-indigo-600/5' : 'border-slate-100 dark:border-white/5'
      }`}>
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-4 opacity-40 py-20">
              <Activity className="w-16 h-16 mb-2" />
              <p className="text-lg font-black uppercase tracking-[0.3em] text-center">Moteur d'analyse clinique actif</p>
            </div>
          )}
          
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-7 py-5 rounded-[2rem] text-sm leading-[1.8] shadow-sm ${
                msg.role === 'user' 
                ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-none font-bold' 
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5 whitespace-pre-wrap font-medium text-base'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {(isLoading || isSummarizing) && (
            <div className="flex gap-5 animate-pulse">
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-7 py-5 rounded-[2rem] flex items-center gap-4">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                  {isSummarizing ? "Génération Synthèse..." : "Analyse clinique..."}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Saisissez vos observations cliniques ou questions..."
              className={`w-full pl-8 pr-16 py-6 bg-white dark:bg-slate-800 border-2 rounded-[2.25rem] focus:outline-none focus:ring-[10px] transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-xl ${
                isExpertMode ? 'border-indigo-600 focus:ring-indigo-600/5' : 'border-slate-100 dark:border-white/5 focus:ring-emerald-500/5'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !query.trim()}
              className={`absolute right-3.5 p-4 text-white rounded-[1.5rem] disabled:opacity-30 transition-all shadow-xl active:scale-95 ${
                isExpertMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
             <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Flux Chiffré AES-256</span>
             <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-indigo-500" /> Analyse Multidimensionnelle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
