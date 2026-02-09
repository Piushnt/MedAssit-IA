
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Globe, Loader2, ExternalLink, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { MedicalStudy } from '../types';
import { searchMedicalGuidelines } from '../services/geminiService';

const DatabaseViewer: React.FC<{ specialty: string }> = ({ specialty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveResults, setLiveResults] = useState<{text: string, sources: any[]} | null>(null);
  const [localStudies, setLocalStudies] = useState<MedicalStudy[]>([]);

  useEffect(() => {
    fetch('/data/medical_database.json')
      .then(res => res.json())
      .then(data => setLocalStudies(data))
      .catch(err => console.error("Erreur base locale:", err));
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Veille Scientifique & Protocoles</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Accédez aux dernières recommandations via Gemini 3 Pro Grounding.</p>
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
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Protocoles Locaux de Référence</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {localStudies.map((study) => (
            <div key={study.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 p-6 flex flex-col h-full hover:shadow-md transition-all">
              <div className="flex justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  study.niveau_preuve === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>Niveau {study.niveau_preuve}</span>
                <span className="text-xs text-slate-400 font-bold uppercase">{study.specialite}</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{study.titre}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{study.contenu_texte}</p>
              <button className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
                Détails du protocole <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
