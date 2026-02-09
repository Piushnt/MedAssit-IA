
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Globe, Loader2, ExternalLink, ShieldCheck, Zap, ArrowRight, Upload, Trash2, FileJson, FileText, Plus } from 'lucide-react';
import { MedicalStudy } from '../types';
import { searchMedicalGuidelines, analyzeClinicalDocument } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { generateUUID } from '../utils/uuid';

const DatabaseViewer: React.FC<{ specialty: string }> = ({ specialty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveResults, setLiveResults] = useState<{text: string, sources: any[]} | null>(null);
  
  const [localStudies, setLocalStudies] = useState<MedicalStudy[]>([]);
  const [customStudies, setCustomStudies] = useState<MedicalStudy[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load static DB
    fetch('/data/medical_database.json')
      .then(res => res.json())
      .then(data => setLocalStudies(data))
      .catch(err => console.error("Erreur base locale:", err));
    
    // Load custom studies from storage
    setCustomStudies(StorageService.getCustomStudies());
  }, []);

  const handleLiveSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingLive(true);
    setLiveResults(null);
    try {
      const results = await searchMedicalGuidelines(searchTerm);
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
                specialite: item.specialite || item.specialty || specialty,
                date_publication: item.date_publication || new Date().toISOString().split('T')[0],
                niveau_preuve: item.niveau_preuve || 'C',
                contenu_texte: item.contenu_texte || item.content || ""
              });
            });
          } else {
             newStudies.push({
                id: data.id || generateUUID(),
                titre: data.titre || data.title || file.name,
                specialite: data.specialite || specialty,
                date_publication: data.date_publication || new Date().toISOString().split('T')[0],
                niveau_preuve: data.niveau_preuve || 'C',
                contenu_texte: data.contenu_texte || data.content || ""
              });
          }
        } else {
          // Fallback for text files or analysis
          const text = await file.text();
          newStudies.push({
            id: generateUUID(),
            titre: file.name,
            specialite: specialty,
            date_publication: new Date().toISOString().split('T')[0],
            niveau_preuve: 'C',
            contenu_texte: text
          });
        }
      } catch (err) {
        console.error("Failed to parse study file", err);
      }
    }

    const updated = [...newStudies, ...customStudies];
    setCustomStudies(updated);
    StorageService.saveCustomStudies(updated);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    StorageService.logAudit('Base Scientifique : Import de protocoles', 'medium');
  };

  const removeCustomStudy = (id: string) => {
    const updated = customStudies.filter(s => s.id !== id);
    setCustomStudies(updated);
    StorageService.saveCustomStudies(updated);
  };

  const allStudies = [...localStudies, ...customStudies];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Veille Scientifique & Protocoles</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Accédez aux dernières recommandations et importez vos propres ressources.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json, .txt" 
            multiple
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Importer Protocoles
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="relative flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une pathologie, un traitement, ou un protocole..."
              className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 dark:text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLiveSearch()}
            />
          </div>
          <button 
            onClick={handleLiveSearch}
            disabled={isSearchingLive || !searchTerm.trim()}
            className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-500/20"
          >
            {isSearchingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            Recherche Live
          </button>
        </div>
      </div>

      {liveResults && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20 p-8 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-xl">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest text-xs">Synthèse des Recommandations (Live Search)</h4>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
              {liveResults.text}
            </div>
          </div>

          {liveResults.sources.length > 0 && (
            <div className="pt-6 border-t border-indigo-100 dark:border-indigo-500/20">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Sources et Publications vérifiées</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveResults.sources.map((chunk: any, i: number) => (
                  chunk.web && (
                    <a 
                      key={i} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-50 dark:border-white/5 hover:border-indigo-300 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-4">
                          {chunk.web.title || "Lien Source Medicale"}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Bibliothèque Scientifique ({allStudies.length})</h4>
          <div className="flex gap-2">
             <span className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400">
               <ShieldCheck className="w-3 h-3" /> Chiffrement Local Actif
             </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allStudies.map((study) => (
            <div key={study.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 p-6 flex flex-col h-full hover:shadow-md transition-all group relative">
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    study.niveau_preuve === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>Niveau {study.niveau_preuve}</span>
                  {customStudies.some(cs => cs.id === study.id) && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Utilisateur</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-400 font-bold uppercase">{study.specialite}</span>
                   {customStudies.some(cs => cs.id === study.id) && (
                     <button 
                       onClick={() => removeCustomStudy(study.id)}
                       className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{study.titre}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{study.contenu_texte}</p>
              <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
                  Détails du protocole <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-300 uppercase">{study.date_publication}</span>
              </div>
            </div>
          ))}
          {allStudies.length === 0 && (
            <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center">
              <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">Aucun protocole disponible. Importez-en un pour commencer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
