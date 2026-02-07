
import React from 'react';
import { ShieldCheck, Activity, LogOut, LayoutDashboard, FileText, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'documents', icon: FileText, label: 'Mes Carnets' },
    { id: 'logs', icon: History, label: 'Historique/Logs' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col sticky top-0 md:h-screen shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MedAssist-IA</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl text-emerald-400 mb-6 border border-slate-700/50">
            <div className="relative">
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Confidentialité Active</span>
          </div>
          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-xl">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Quitter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 relative overflow-y-auto">
        <header className="sticky top-0 z-10 glass-morphism px-8 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-700">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-300"></div>
            </div>
          </div>
        </header>
        <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
