
import React, { useState } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import { HealthDocument, AdviceLog } from '../types';
import { queryGemini } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface DashboardProps {
  documents: HealthDocument[];
  addLog: (log: AdviceLog) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, addLog }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await queryGemini(userMsg, documents);
      
      const botResponse = { role: 'bot' as const, text: response };
      setChatHistory(prev => [...prev, botResponse]);

      // Log the advice
      const newLog: AdviceLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        query: userMsg,
        response: response,
        sources: documents.map(d => d.name)
      };
      addLog(newLog);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
        <div className="bg-blue-50 p-3 rounded-xl">
          <Info className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Prêt pour votre analyse ?</h3>
          <p className="text-slate-500 mt-1">
            Posez une question sur votre santé ou vos documents téléchargés. 
            L'IA traitera vos données localement avant analyse.
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Bot className="w-12 h-12 opacity-20" />
              <p>Aucun message pour le moment.</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200 whitespace-pre-wrap'
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
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-slate-500">Analyse en cours...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Que disent mes derniers résultats de sang ?"
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !query.trim()}
              className="absolute right-2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
