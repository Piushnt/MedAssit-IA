
import React from 'react';
import { History, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { AdviceLog } from '../types';

interface LogViewerProps {
  logs: AdviceLog[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Historique des conseils</h3>
          <p className="text-slate-500">Retrouvez les analyses précédentes de l'IA.</p>
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          {logs.length} sessions
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-emerald-200 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="flex gap-1">
                {log.sources.slice(0, 2).map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[80px]">
                    {s}
                  </span>
                ))}
                {log.sources.length > 2 && <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">+{log.sources.length - 2}</span>}
              </div>
            </div>
            
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-emerald-500" />
              {log.query}
            </h4>
            
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed max-h-40 overflow-hidden relative">
              <p className="whitespace-pre-wrap">{log.response}</p>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
            </div>

            <button className="mt-4 text-emerald-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              Voir l'analyse complète <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p>Aucun historique disponible. Commencez une conversation sur le tableau de bord.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
