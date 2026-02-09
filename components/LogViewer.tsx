
import React from 'react';
import { History, Calendar, ExternalLink, ChevronRight, Download, Share2 } from 'lucide-react';
import { AdviceLog } from '../types';

interface LogViewerProps {
  logs: AdviceLog[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `medassist_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
              <button className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
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
    </div>
  );
};

export default LogViewer;
