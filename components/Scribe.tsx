
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, FileText, Save, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { generateSOAPNote } from '../services/geminiService';

const Scribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + " " + currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (transcript.trim()) {
        handleSummarize();
      }
    } else {
      setTranscript('');
      setSummary('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    
    try {
      const soapNote = await generateSOAPNote(transcript);
      setSummary(soapNote);
    } catch (err) {
      setSummary("Une erreur est survenue lors de la structuration de la note.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recording Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm text-center">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 transition-all duration-500 ${isRecording ? 'bg-red-500 shadow-2xl shadow-red-500/20 animate-pulse' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
              {isRecording ? <Mic className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Scribe Ambiant</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Écoute et structure votre consultation en temps réel via Gemini 3 Flash.</p>
            
            <button 
              onClick={toggleRecording}
              className={`w-full mt-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-105'}`}
            >
              {isRecording ? <><MicOff className="w-5 h-5" /> Arrêter & Générer SOAP</> : <><Mic className="w-5 h-5" /> Démarrer l'écoute</>}
            </button>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">Confidentialité</span>
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 leading-relaxed">
              Le flux audio est traité par l'IA de façon sécurisée. Aucune donnée vocale n'est stockée après traitement.
            </p>
          </div>
        </div>

        {/* Real-time Transcription & Note Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <Activity className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Flux de transcription</span>
              </div>
              {summary && (
                <button className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                  <Save className="w-4 h-4" /> Sauvegarder Note
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700">
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Transcription brute</span>
                </div>
                <p className={`text-lg font-medium leading-relaxed ${isRecording ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {transcript || (isRecording ? "Le patient parle..." : "En attente du début de la consultation...")}
                </p>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-3 py-4 bg-indigo-50 dark:bg-indigo-900/20 px-6 rounded-2xl animate-pulse">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Génération SOAP par Gemini...</span>
                </div>
              )}

              {summary && (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Synthèse Structurée SOAP</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed shadow-inner">
                    {summary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scribe;
