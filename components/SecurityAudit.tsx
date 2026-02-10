
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, Download, AlertTriangle, UserCheck, Clock, RefreshCcw } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuditEntry } from '../types';

const SecurityAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setLogs(StorageService.getAuditLogs());
  }, []);

  const refreshLogs = () => {
    setLogs(StorageService.getAuditLogs());
  };

  const handleExportHDS = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `hds_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Registre de Sécurité Immuable</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Traçabilité complète des accès aux données de santé (Conformité RGPD).</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refreshLogs} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 transition-colors">
            <RefreshCcw className="w-5 h-5 text-slate-500" />
          </button>
          <button 
            onClick={handleExportHDS}
            disabled={logs.length === 0}
            className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-20"
          >
            <Download className="w-4 h-4" /> Export HDS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
          <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">État Système</p>
          <h4 className="text-2xl font-black mt-1">SÉCURISÉ</h4>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 border border-white/5">
          <Lock className="w-8 h-8 mb-4 opacity-80 text-indigo-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Chiffrement</p>
          <h4 className="text-2xl font-black mt-1">AES-256</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <Eye className="w-8 h-8 mb-4 opacity-80 text-indigo-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activité Logguée</p>
          <h4 className="text-2xl font-black mt-1 dark:text-white">{logs.length} Événements</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Horodatage</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action Clinique</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Praticien</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ressource</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gravité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-800 dark:text-white">{log.action}</td>
                  <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 font-bold">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {log.user}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">{log.resourceId || '—'}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      log.severity === 'high' ? 'bg-red-100 text-red-700' : 
                      log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Lock className="w-12 h-12 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Aucun log enregistré</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
