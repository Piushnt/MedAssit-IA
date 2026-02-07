
import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info, Sparkles, AlertTriangle, PhoneCall } from 'lucide-react';
import { HealthDocument, AdviceLog } from '../types';
import { queryGemini } from '../services/geminiService';

interface DashboardProps {
  documents: HealthDocument[];
  addLog: (log: AdviceLog) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, addLog }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);

  const handleSend = async (customPrompt?: string, isSummary: boolean = false) => {
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) return;

    if (!isSummary) setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: isSummary ? "Générer ma synthèse de santé" : promptToSend }]);
    
    if (isSummary) setIsSummarizing(true);
    else setIsLoading(true);

    try {
      const response = await queryGemini(promptToSend, documents, isSummary);
      
      // Check for emergency keywords in response
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
        sources: documents.map(d => d.name)
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: "Erreur lors de l'analyse." }]);
    } finally {
      setIsLoading(false);
      setIsSummarizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Emergency Alert Banner */}
      {showEmergency && (
        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl animate-bounce flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold">Urgence Médicale Possible !</p>
              <p className="text-sm opacity-90">Appelez immédiatement le 15 ou le 112.</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
            <PhoneCall className="w-4 h-4" /> Appeler
          </button>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Analyse de Documents</h3>
            <p className="text-slate-500 text-sm mt-1">Posez des questions sur vos {documents.length} documents.</p>
          </div>
        </div>

        <button 
          onClick={() => handleSend("Fais-moi un résumé complet de ma santé basé sur tous mes documents.", true)}
          disabled={isSummarizing || documents.length === 0}
          className="bg-emerald-500 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex items-start gap-4 hover:bg-emerald-600 transition-all group disabled:opacity-50 disabled:grayscale"
        >
          <div className="bg-emerald-400/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold">Générer ma Synthèse</h3>
            <p className="text-emerald-50 text-sm mt-1">Croise toutes vos données de santé.</p>
          </div>
        </button>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Bot className="w-12 h-12 opacity-10" />
              <p className="text-center italic">"Quels ont été mes résultats de glycémie sur les 6 derniers mois ?"</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : msg.text.includes("⚠️") 
                  ? 'bg-red-50 text-red-700 border-2 border-red-200 rounded-tl-none'
                  : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100 whitespace-pre-wrap'
              }`}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {(isLoading || isSummarizing) && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  {isSummarizing ? "Génération de synthèse..." : "Analyse en cours..."}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Analyse mes documents pour voir s'il y a un risque cardiaque."
              className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !query.trim()}
              className="absolute right-2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
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
