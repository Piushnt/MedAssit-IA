
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Activity, ShieldCheck, Copy, Check, Waves, Volume2, Wand2 } from 'lucide-react';
import { genererNoteCliniqueSOAP, optimiserFluxTexte } from '../services/analysisService';
import { StorageService } from '../services/storageService';

const Scribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [copied, setCopied] = useState(false);
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
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        if (currentTranscript) {
          setTranscript(prev => prev + (prev ? " " : "") + currentTranscript.trim());
        }
      };
    }
  }, []);

  const handleImproveTranscript = async () => {
    if (!transcript.trim()) return;
    setIsCleaning(true);
    try {
      const improved = await optimiserFluxTexte(transcript);
      setTranscript(improved);
      StorageService.logAudit('Scribe : Optimisation du flux', 'low');
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
      StorageService.logAudit('Scribe : Fin de capture audio', 'low');
    } else {
      setTranscript('');
      setSummary('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        StorageService.logAudit('Scribe : Début de capture audio', 'low');
      } catch (err) {
        alert("Microphone inaccessible.");
      }
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    try {
      const soapNote = await genererNoteCliniqueSOAP(transcript);
      setSummary(soapNote);
      StorageService.logAudit('Scribe : Structuration SOAP finalisée', 'medium');
    } catch (err) {
      setSummary("Erreur lors de la structuration. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-3">Assistant Clinique Ambiant</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-500" /> Digitalisation audio du dossier patient.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secret Médical Préservé</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-10 relative transition-all duration-500 ${isRecording ? 'scale-110' : ''}`}>
               {isRecording && (
                 <>
                   <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-10"></div>
                   <div className="absolute inset-4 bg-red-500 rounded-full animate-pulse opacity-20"></div>
                 </>
               )}
               <div className={`w-full h-full rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-xl ${isRecording ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {isRecording ? <Mic className="w-14 h-14" /> : <MicOff className="w-14 h-14" />}
               </div>
            </div>

            <button 
              onClick={toggleRecording} 
              className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 transition-all shadow-xl active:scale-95 mb-6 ${
                isRecording 
                  ? 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white' 
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isRecording ? "Arrêter la capture" : "Lancer la capture"}
            </button>

            {transcript && !isRecording && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <button 
                  onClick={handleImproveTranscript} 
                  disabled={isCleaning} 
                  className="w-full py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-white/10 font-black text-xs flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  Optimiser la transcription
                </button>
                <button 
                  onClick={handleSummarize} 
                  disabled={isProcessing} 
                  className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50 group"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                  Structurer Note SOAP
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden border border-white/5">
            <div className="absolute -top-6 -right-6 p-8 opacity-10">
              <Waves className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">Analyse Ambiante</h4>
            </div>

            <div className="space-y-6 relative z-10">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Le système segmente automatiquement les échanges cliniques pour isoler les faits médicaux des observations contextuelles.</p>
            </div>

            <div className="pt-6 border-t border-white/10 relative z-10">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                <Activity className="w-3 h-3" /> Structuration SOAP Immuable
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm h-[780px] flex flex-col overflow-hidden relative">
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
               <div className="space-y-8 mb-16">
                  <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 py-4 z-10 border-b border-slate-50 dark:border-white/5 mb-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Flux audio actif</h4>
                  </div>
                  <p className={`text-2xl font-medium leading-[1.8] tracking-tight ${isRecording ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600 italic'}`}>
                    {transcript || "En attente du signal audio."}
                  </p>
               </div>

               {summary && (
                  <div className="mt-12 pt-12 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600">Note Clinique SOAP</h4>
                      <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copié' : 'Copier Note'}
                      </button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-100 font-medium whitespace-pre-wrap leading-[2] text-xl">
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
