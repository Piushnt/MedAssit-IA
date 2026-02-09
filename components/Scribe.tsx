
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, FileText, Save, Sparkles, Activity, ShieldCheck, Copy, Check, History, RotateCcw, Download, Wand2 } from 'lucide-react';
import { generateSOAPNote, improveTranscript } from '../services/geminiService';
import { StorageService } from '../services/storageService';

const Scribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        if (currentTranscript) {
          setTranscript(prev => prev + (prev ? " " : "") + currentTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Erreur de reconnaissance vocale:", event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };
    }
  }, []);

  const handleCleanTranscript = async () => {
    if (!transcript.trim()) return;
    setIsCleaning(true);
    try {
      const cleaned = await improveTranscript(transcript);
      setTranscript(cleaned);
      StorageService.logAudit('Scribe : Nettoyage transcription', 'low');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      StorageService.logAudit('Scribe : Fin d\'enregistrement', 'low');
    } else {
      setTranscript('');
      setSummary('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        StorageService.logAudit('Scribe : Début d\'enregistrement', 'low');
      } catch (err) {
        console.error("Échec du démarrage:", err);
        alert("La reconnaissance vocale n'a pas pu démarrer. Vérifiez les permissions micro.");
      }
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    try {
      const soapNote = await generateSOAPNote(transcript);
      setSummary(soapNote);
      StorageService.logAudit('Scribe : Génération note SOAP', 'medium');
    } catch (err) {
      setSummary("Une erreur est survenue lors de la structuration de la note.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            Scribe Médical Ambiant
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Capturez la consultation en haute fidélité.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
            <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-6 relative ${isRecording ? 'scale-110' : ''}`}>
               {isRecording && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>}
               <div className={`w-full h-full rounded-full flex items-center justify-center z-10 ${isRecording ? 'bg-red-500 text-white shadow-2xl shadow-red-500/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {isRecording ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12" />}
               </div>
            </div>
            
            <button onClick={toggleRecording} className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 transition-all shadow-xl ${isRecording ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}>
              {isRecording ? "Arrêter la session" : "Démarrer Scribe"}
            </button>

            {transcript && !isRecording && (
              <div className="mt-4 space-y-3">
                <button 
                  onClick={handleCleanTranscript}
                  disabled={isCleaning}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Nettoyer Transcription
                </button>
                <button 
                  onClick={handleSummarize}
                  disabled={isProcessing}
                  className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  Structurer Note SOAP
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 h-[600px] flex flex-col bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
             <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Transcription Actuelle</h4>
                <p className={`text-xl font-medium leading-relaxed ${isRecording ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                  {transcript || (isRecording ? "Capture de l'audio..." : "La transcription apparaîtra ici.")}
                </p>
             </div>
             {summary && (
                <div className="mt-12 pt-12 border-t border-slate-50 dark:border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Note SOAP Structurée</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap leading-[1.8] text-lg">
                    {summary}
                  </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scribe;
