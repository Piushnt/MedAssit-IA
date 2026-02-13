
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Globe, Loader2, ExternalLink, ShieldCheck, Zap, ArrowRight, Plus, Filter, Tag } from 'lucide-react';
import { MedicalStudy } from '../types';
import { rechercherDirectivesSante } from '../services/analysisService';
import { StorageService } from '../services/storageService';
import { generateUUID } from '../utils/uuid';

const DatabaseViewer: React.FC<{ specialty: string }> = ({ specialty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('Toutes');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveResults, setLiveResults] = useState<{text: string, sources: any[]} | null>(null);
  
  const [localStudies, setLocalStudies] = useState<MedicalStudy[]>([]);
  const [customStudies, setCustomStudies] = useState<MedicalStudy[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const medicalSpecialties = [
    "Toutes",
    "Médecine Générale", 
    "Cardiologie", 
    "Endocrinologie", 
    "Neurologie", 
    "Pédiatrie", 
    "Radiologie",
    "Oncologie",
    "Psychiatrie"
  ];

  useEffect(() => {
    fetch('/data/medical_database.json')
      .then(res => res.json())
      .then(data => setLocalStudies(data))
      .catch(err => console.error("Erreur base locale:", err));
    
    setCustomStudies(StorageService.getCustomStudies());
  }, []);

  const handleLiveSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingLive(true);
    setLiveResults(null);
    try {
      const results = await rechercherDirectivesSante(searchTerm);
      setLiveResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingLive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newStudies: MedicalStudy[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        if (file.type === 'application/json') {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              newStudies.push({
                id: item.id || generateUUID(),
                titre: item.titre || item.title || "Étude Importée",
                specialite: item.specialite || specialty,
                date_publication: item.date_publication || new Date().toISOString().split('T')[0],
                niveau_preuve: item.niveau_preuve || 'C',
                contenu_texte: item.contenu_texte || item.content || ""
              });
            });
          }
        }
      } catch (err) {
        console.error("Failed to parse study file", err);
      }
    }

    const updated = [...newStudies, ...customStudies];
    setCustomStudies(updated);
    StorageService.saveCustomStudies(updated);
    setIsUploading(false);
  };

  const allStudies = [...localStudies, ...customStudies].filter(s => {
    const matchesSearch = s.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.contenu_texte.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'Toutes' || s.specialite === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-3">Base Scientifique Intégrée</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic">Accès direct aux protocoles et directives de santé mondiales.</p>
        </div>
        <div className="flex gap-4">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Importer Protocoles
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Sujet de recherche clinique..."
              className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 dark:text-white shadow-inner"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative md:w-64 group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-slate-600 dark:text-slate-300 appearance-none cursor-pointer"
              value={specialtyFilter}
              onChange={e => setSpecialtyFilter(e.target.value)}
            >
              {medicalSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button 
            onClick={handleLiveSearch}
            disabled={isSearchingLive || !searchTerm.trim()}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl"
          >
            {isSearchingLive ? <Loader2 className="w-6 h-6 animate-spin" /> : <Globe className="w-6 h-6" />}
            Recherche Contextuelle
          </button>
        </div>
      </div>

      {liveResults && (
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-indigo-100 dark:border-indigo-500/20 p-12 space-y-8 animate-in slide-in-from-bottom-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-indigo-50 dark:border-indigo-900/30 pb-8">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Synthèse des Recommandations Cliniques</h4>
              </div>
            </div>
            <button onClick={() => setLiveResults(null)} className="text-slate-300 hover:text-red-500 font-black text-xs uppercase transition-colors">Masquer</button>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="text-xl text-slate-700 dark:text-slate-200 leading-[2] whitespace-pre-wrap font-medium">
              {liveResults.text}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/5 pb-6">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
            <Tag className="w-4 h-4 text-indigo-500" /> Bibliothèque Clinique ({allStudies.length})
          </h4>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {allStudies.map((study) => (
            <div key={study.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="flex justify-between mb-6">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  study.niveau_preuve === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>Preuve {study.niveau_preuve}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{study.specialite}</span>
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white mb-4 tracking-tight leading-snug">{study.titre}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-4 mb-8 leading-relaxed font-medium italic">{study.contenu_texte}</p>
              <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <button className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase flex items-center gap-3 hover:translate-x-2 transition-transform">
                  Consulter le protocole <ArrowRight className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{study.date_publication}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
