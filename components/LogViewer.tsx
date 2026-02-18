
import React, { useState } from 'react';
import { History, Calendar, ExternalLink, ChevronRight, Download, Share2, X, Sparkles, Loader2, AlertCircle, FileText, Activity } from 'lucide-react';
import { AdviceLog } from '../types';
import { analyserRapportHistorique } from '../services/analysisService';

interface LogViewerProps {
  logs: AdviceLog[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<AdviceLog | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `medassist_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeepAnalysis = async (log: AdviceLog) => {
    setSelectedLog(log);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    try {
      const result = await analyserRapportHistorique(log);
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisResult("Erreur lors de l'analyse du rapport.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Historique Clinique</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Synthèse chronologique des interactions IA.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:opacity-90 transition-all disabled:opacity-20 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {logs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-slate-400">
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-bold">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex gap-2">
                {log.sources.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-50 dark:border-white/5 truncate max-w-[120px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-500 flex-shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                {log.query}
              </h4>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-48 overflow-hidden relative border border-slate-50 dark:border-white/5">
              <p className="whitespace-pre-wrap font-medium">{log.response}</p>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-800/50 to-transparent"></div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handleDeepAnalysis(log)}
                className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
              >
                Analyser le rapport complet <ExternalLink className="w-4 h-4" />
              </button>
              <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
            <History className="w-16 h-16 mx-auto mb-6 text-slate-200 dark:text-slate-800" />
            <h4 className="text-xl font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest">Aucune session enregistrée</h4>
            <p className="text-slate-400 dark:text-slate-600 font-medium mt-2">Commencez un diagnostic sur le tableau de bord.</p>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-widest text-sm">Analyse de Rapport Clinique</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session du {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Content side */}
                <div className="space-y-8">
                  <section>
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Requête d'origine
                    </h5>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                      {selectedLog.query}
                    </div>
                  </section>

                  <section>
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> Réponse Graduée
                    </h5>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedLog.response}
                    </div>
                  </section>
                </div>

                {/* Analysis side */}
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest">Revue AI Approfondie</h5>
                    {!analysisResult && !isAnalyzing && (
                      <button
                        onClick={() => handleDeepAnalysis(selectedLog)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                      >
                        Lancer l'analyse
                      </button>
                    )}
                  </div>

                  {isAnalyzing && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Audit médical en cours...</p>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
                      <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 text-slate-700 dark:text-slate-200 text-sm leading-relaxed font-medium whitespace-pre-wrap shadow-sm">
                        {analysisResult}
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-500/10 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-200/60 font-medium leading-relaxed italic">
                          Cette revue est un support à la décision et ne remplace pas une analyse clinique humaine approfondie.
                        </p>
                      </div>
                    </div>
                  )}

                  {!analysisResult && !isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-20">
                      <Activity className="w-12 h-12 text-slate-300" />
                      <p className="text-xs font-bold text-slate-400 max-w-[200px]">Cliquez sur "Lancer l'analyse" pour obtenir un audit médical IA de cette session.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-10 py-6 border-t border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/50 flex justify-end gap-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default LogViewer;
