
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, LogOut, LayoutDashboard, Users, FileText, History, Database, Sun, Moon, Mic, Lock } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  doctorName?: string;
  specialty?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, doctorName, specialty }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'scribe', icon: Mic, label: 'Scribe Ambiant' },
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'database', icon: Database, label: 'Base Scientifique' },
    { id: 'audit', icon: Lock, label: 'Sécurité & Audit' },
  ];

  const handleLogout = () => {
    if (confirm("Déconnexion sécurisée ?")) {
      StorageService.logout();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <aside className="w-full md:w-72 bg-slate-900 text-white p-8 flex flex-col sticky top-0 md:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="bg-indigo-500 p-2.5 rounded-[1.25rem] shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">MedAssist Pro</h1>
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">Scribe & Expert</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-2xl text-emerald-400 mb-6 border border-white/5">
            <div className="relative">
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Flux Chiffré AES-256</span>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 w-full text-slate-400 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-2xl">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-y-auto">
        <header className="sticky top-0 z-10 glass-morphism px-10 py-7 border-b border-slate-200/60 dark:border-white/5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1.5">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Espace de Travail Clinique</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-yellow-400 hover:scale-110 active:scale-95 transition-all shadow-sm">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-5 border-l border-slate-200 dark:border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">Dr. {doctorName}</p>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{specialty}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-sm">
                {doctorName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <div className="p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
