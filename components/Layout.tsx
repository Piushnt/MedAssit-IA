
import React from 'react';
import { ShieldCheck, Activity, LogOut, LayoutDashboard, Users, FileText, History, Database } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  doctorName?: string;
  specialty?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, doctorName, specialty }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'patients', icon: Users, label: 'Mes Patients' },
    { id: 'database', icon: Database, label: 'Base Scientifique' },
    { id: 'documents', icon: FileText, label: 'Mes Carnets' },
    { id: 'logs', icon: History, label: 'Historique' },
  ];

  const handleLogout = () => {
    if (confirm("Voulez-vous vous déconnecter ? Les données locales resteront sur ce navigateur.")) {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white p-8 flex flex-col sticky top-0 md:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="bg-indigo-500 p-2.5 rounded-[1rem] shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">MedAssist Pro</h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">IA Clinique</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-2xl text-emerald-400 mb-6 border border-slate-700/50">
            <div className="relative">
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Flux Chiffré AES-256</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full text-slate-400 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-[1.25rem] group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <header className="sticky top-0 z-10 glass-morphism px-10 py-6 border-b border-slate-200/60 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Système de Décision Clinique
            </h2>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">Dr. {doctorName}</p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{specialty}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
              {doctorName?.charAt(0)}
            </div>
          </div>
        </header>
        
        <div className="p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
