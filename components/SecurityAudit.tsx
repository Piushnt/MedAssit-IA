
import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, Download, AlertTriangle, UserCheck, Clock } from 'lucide-react';
import { AuditEntry } from '../types';

const SecurityAudit: React.FC = () => {
  const [logs] = useState<AuditEntry[]>([
    { id: '1', timestamp: Date.now() - 120000, action: 'Analyse IA Document', user: 'Dr. Sarah Martin', severity: 'low', resourceId: 'DOC-992' },
    { id: '2', timestamp: Date.now() - 850000, action: 'Accès Dossier Patient', user: 'Dr. Sarah Martin', severity: 'medium', resourceId: 'PAT-881' },
    { id: '3', timestamp: Date.now() - 3600000, action: 'Export Rapport PDF', user: 'Dr. Sarah Martin', severity: 'high', resourceId: 'REP-001' },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Registre de Sécurité Immuable</h3>
          <p className="text-slate-500 dark:text-slate-400">Traçabilité complète des accès aux données de santé (RGPD/HDS).</p>
        </div>
        <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Download className="w-4 h-4" /> Exporter le Log
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
          <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-xs font-black uppercase tracking-widest opacity-70">État Système</p>
          <h4 className="text-2xl font-black mt-1">Conforme</h4>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20">
          <Lock className="w-8 h-8 mb-4 opacity-80 text-indigo-400" />
          <p className="text-xs font-black uppercase tracking-widest opacity-70">Chiffrement</p>
          <h4 className="text-2xl font-black mt-1">AES-256 Actif</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <Eye className="w-8 h-8 mb-4 opacity-80 text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Accès (24h)</p>
          <h4 className="text-2xl font-black mt-1 dark:text-white">12 Sessions</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Horodatage</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Praticien</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ressource</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gravité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-white">{log.action}</td>
                <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-500" /> {log.user}
                </td>
                <td className="px-8 py-5 text-sm font-mono text-slate-400">{log.resourceId}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    log.severity === 'high' ? 'bg-red-100 text-red-700' : 
                    log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {log.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityAudit;
