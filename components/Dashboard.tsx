
import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info, Sparkles, AlertTriangle, PhoneCall, BookOpen, Zap } from 'lucide-react';
import { HealthDocument, AdviceLog, Doctor, Patient } from '../types';
import { queryGemini, LocalStudy } from '../services/geminiService';

interface DashboardProps {
  doctor: Doctor;
  patients: Patient[];
  documents?: HealthDocument[];
  addLog?: (log: AdviceLog) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  doctor, 
  patients, 
  documents: propsDocuments, 
  addLog: propsAddLog 
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  
  const documents = propsDocuments || patients.flatMap(p => p.documents);
  
  const addLog = propsAddLog || ((log: AdviceLog) => {
    console.debug("Medical log generated internally:", log);
  });

  const [isExpertMode, setIsExpertMode] = useState(false);
  const [localStudies, setLocalStudies] = useState<LocalStudy[]>([]);

  useEffect(() => {
    fetch('/data/studies.json')
      .then(res => res.json())
      .then(data => setLocalStudies(data))
      .catch(err => console.error("Erreur chargement études:", err));
  }, []);

  const handleSend = async (customPrompt?: string, isSummary: boolean = false) => {
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) return;

    if (!isSummary) setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: isSummary ? "Générer ma synthèse de santé" : promptToSend }]);
    
    if (isSummary) setIsSummarizing(true);
    else setIsLoading(true);

    try {
      const sources = isExpertMode ? localStudies : [];
      const response = await queryGemini(promptToSend, documents, isSummary, sources);
      
      if (response.includes("⚠️ URGENCE CRITIQUE")) {
        setShowEmergency(true);
      } else {
        setShowEmergency(false);
      }

      setChatHistory(prev => [...prev, { role: 'bot', text: response }]);

      addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        query: promptToSend,
        response: response,
        sources: [...documents.map(d => d.name), ...(isExpertMode ? ["Base d'expertise locale"] : [])]
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "Erreur lors de l'analyse IA. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
      setIsSummarizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex items-start gap-4 hover:shadow-md transition-all">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Contexte Patient</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{documents.length} document{documents.length > 1 ? 's' : ''} analysables.</p>
          </div>
        </div>

        <button 
          onClick={() => handleSend("Fais-moi un résumé complet de ma santé basé sur tous mes documents.", true)}
          disabled={isSummarizing || documents.length === 0}
          className="bg-emerald-500 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-white flex items-start gap-4 hover:bg-emerald-600 transition-all group disabled:opacity-50 disabled:grayscale"
        >
          <div className="bg-emerald-400/30 p-3 rounded-2xl group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Synthèse Globale</h3>
            <p className="text-emerald-50 text-sm mt-1 tracking-tight">Analyse transversale intelligente.</p>
          </div>
        </button>
      </div>

      {/* Mode Expertise Toggle */}
      <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${
        isExpertMode 
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 shadow-sm' 
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl transition-colors ${isExpertMode ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isExpertMode ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>Mode Expertise Médicale</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Intégration du RAG scientifique ({localStudies.length} études actives).</p>
          </div>
        </div>
        <button 
          onClick={() => setIsExpertMode(!isExpertMode)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
            isExpertMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            isExpertMode ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Emergency Alert Banner */}
      {showEmergency && (
        <div className="bg-red-600 text-white p-5 rounded-3xl shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-2 rounded-xl animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Alerte Clinique Critique !</p>
              <p className="text-sm opacity-90 font-medium">L'IA a détecté des signes d'urgence immédiate.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-lg">
            <PhoneCall className="w-4 h-4" /> Appeler le 15
          </button>
        </div>
      )}

      {/* Chat Area - DYNAMIC HEIGHT & DARK MODE READY */}
      <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border flex flex-col transition-all duration-500 overflow-hidden ${
        isExpertMode ? 'border-indigo-200 dark:border-indigo-500/30 ring-4 ring-indigo-500/5 dark:ring-indigo-500/10' : 'border-slate-100 dark:border-white/5'
      }`}>
        {isExpertMode && (
          <div className="bg-indigo-100/50 dark:bg-indigo-900/30 px-6 py-2 flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-indigo-500/20">
            <Zap className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" /> Co-pilote Scientifique Actif
          </div>
        )}
        
        <div className={`overflow-y-auto px-8 py-6 space-y-5 transition-all duration-700 ${
          chatHistory.length === 0 ? 'min-h-[120px]' : 'max-h-[600px] min-h-[300px]'
        }`}>
          {chatHistory.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 gap-3">
              <Bot className="w-6 h-6 opacity-30" />
              <p className="text-sm font-medium italic opacity-60">"Prêt pour une consultation, Dr. {doctor.name.split(' ').pop()}"</p>
            </div>
          )}
          
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${isExpertMode ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                  <Bot className="w-6 h-6" />
                </div>
              )}
              <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-none font-medium' 
                : msg.text.includes("⚠️") 
                  ? 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-100 dark:border-red-900/50 rounded-tl-none font-bold'
                  : isExpertMode 
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-700 dark:text-slate-300 rounded-tl-none border border-indigo-50 dark:border-indigo-500/10 whitespace-pre-wrap'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-white/5 whitespace-pre-wrap'
              }`}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center flex-shrink-0 shadow-sm text-slate-400 dark:text-slate-500 font-black text-xs">
                  DR
                </div>
              )}
            </div>
          ))}
          
          {(isLoading || isSummarizing) && (
            <div className="flex gap-4 animate-pulse">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isExpertMode ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                <Loader2 className={`w-6 h-6 animate-spin ${isExpertMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-5 py-4 rounded-[1.5rem] flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isSummarizing ? "Synthèse en cours" : "Analyse clinique"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isExpertMode ? "Question clinique spécialisée..." : "Observations ou questions..."}
              className={`w-full pl-6 pr-14 py-5 bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 ${
                isExpertMode ? 'border-indigo-100 dark:border-indigo-500/20 focus:ring-indigo-500/10' : 'border-slate-100 dark:border-white/5 focus:ring-emerald-500/10'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !query.trim()}
              className={`absolute right-3 p-3 text-white rounded-xl disabled:opacity-30 transition-all shadow-lg active:scale-95 ${
                isExpertMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-indigo-900/20' : 'bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-600 shadow-slate-200 dark:shadow-none'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
