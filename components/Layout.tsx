import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, LogOut, LayoutDashboard, Users, FileText, History, Database, Sun, Moon, Mic, Lock, RefreshCcw, CheckCircle, AlertCircle, Menu, X, Pill } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  doctorName?: string;
  specialty?: string;
  saveStatus?: 'saved' | 'saving' | 'error';
  lastSaved?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, doctorName, specialty, saveStatus = 'saved', lastSaved }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    { id: 'prescription', icon: Pill, label: 'Ordonnances' },
    { id: 'patient-report', icon: FileText, label: 'Rapports Cliniques' },
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'logs', icon: History, label: 'Historique' },
    { id: 'database', icon: Database, label: 'Base Scientifique' },
    { id: 'audit', icon: Lock, label: 'Sécurité & Audit' },
  ];

  const handleLogout = () => {
    if (confirm("Déconnexion sécurisée ?")) {
      StorageService.logout();
      window.location.reload();
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight text-sm">MedAssist Pro</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white p-8 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:h-screen md:sticky md:top-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-4 mb-12 px-2">
          <div className="bg-indigo-500 p-2.5 rounded-[1.25rem] shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">MedAssist Pro</h1>
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">Local-First AI</span>
          </div>
        </div>

        {/* Mobile Logo in Menu */}
        <div className="md:hidden mb-8 flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Menu Principal</span>
          <button onClick={() => setIsMenuOpen(false)} className="bg-slate-800 p-2 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto md:overflow-visible custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
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
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">AES-256 Actif</span>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 w-full text-slate-400 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-2xl group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Quitter</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-y-auto h-screen md:h-auto">
        <header className="sticky top-0 z-10 glass-morphism px-4 md:px-10 py-6 border-b border-slate-200/60 dark:border-white/5 flex justify-between items-center transition-all">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] hidden md:inline">
                {navItems.find(i => i.id === activeTab)?.label}
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/5">
                {saveStatus === 'saving' ? (
                  <RefreshCcw className="w-2.5 h-2.5 text-indigo-500 animate-spin" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                ) : (
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                )}
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  {saveStatus === 'saving' ? 'Synchro...' : lastSaved ? `Sauvé ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Protégé'}
                </span>
              </div>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight truncate border-l-4 border-indigo-500 pl-3 md:border-0 md:pl-0">
              {navItems.find(i => i.id === activeTab)?.label || "Espace Clinique"}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button onClick={() => setIsDark(!isDark)} className="p-2 md:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-yellow-400 hover:scale-110 active:scale-95 transition-all shadow-sm">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-5 border-l border-slate-200 dark:border-white/10 pl-6">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">Dr. {doctorName}</p>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{specialty}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-sm">
                {doctorName?.charAt(0)}
              </div>
            </div>
            {/* Mobile Profile Icon */}
            <div className="md:hidden h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm">
              {doctorName?.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-4 md:p-10">{children}</div>
      </main>
    </div>
  );
};

export default Layout;