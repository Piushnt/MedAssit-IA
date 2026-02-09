
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, FileText, Save, Sparkles, Activity, ShieldCheck, Copy, Check, History, RotateCcw, Download, Wand2, Info, MessageSquare, ListChecks } from 'lucide-react';
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
      const improved = await improveTranscript(transcript);
      setTranscript(improved);
      StorageService.logAudit('Scribe : Nettoyage IA de transcription', 'low');
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
        alert("Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.");
      }
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    try {
      const soapNote = await generateSOAPNote(transcript);
      setSummary(soapNote);
      StorageService.logAudit('Scribe : Note SOAP générée', 'medium');
    } catch (err) {
      setSummary("Erreur lors de la structuration de la note. Veuillez réessayer.");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-2">Scribe Médical Ambiant</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic">Libérez votre attention, l'IA s'occupe de la structure.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 shadow-sm">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Confidentialité Locale Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Panneau de Contrôle & Conseils */}
        <div className="lg:col-span-4 space-y-8">
          {/* Module d'Enregistrement */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-8 relative transition-transform duration-500 ${isRecording ? 'scale-110' : ''}`}>
               {isRecording && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>}
               <div className={`w-full h-full rounded-full flex items-center justify-center z-10 transition-colors duration-500 shadow-inner ${isRecording ? 'bg-red-500 text-white shadow-2xl shadow-red-500/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {isRecording ? <Mic className="w-14 h-14" /> : <MicOff className="w-14 h-14" />}
               </div>
            </div>

            <button 
              onClick={toggleRecording} 
              className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 transition-all shadow-xl active:scale-95 ${
                isRecording 
                  ? 'bg-slate-900 dark:bg-slate-800 text-white ring-4 ring-red-500/20' 
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isRecording ? "Terminer la session" : "Démarrer le Scribe"}
            </button>

            {transcript && !isRecording && (
              <div className="mt-6 space-y-4 animate-in slide-in-from-top-4 duration-500">
                <button 
                  onClick={handleImproveTranscript} 
                  disabled={isCleaning} 
                  className="w-full py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-white/10 font-black text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 text-indigo-500" />}
                  Lissage IA (Clean-up)
                </button>
                <button 
                  onClick={handleSummarize} 
                  disabled={isProcessing} 
                  className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50 group"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                  Générer Note SOAP
                </button>
              </div>
            )}
          </div>

          {/* Conseils d'utilisation restaurés */}
          <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-600/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Info className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em]">Conseils d'utilisation</h4>
            </div>

            <ul className="space-y-5">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-sm font-medium leading-relaxed">
                  <span className="font-black">Parlez naturellement :</span> L'IA comprend le contexte même si vous parlez avec le patient.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <p className="text-sm font-medium leading-relaxed">
                  <span className="font-black">Dictez vos constantes :</span> Prononcez "Tension 12/8" ou "Poids 75 kg" pour les inclure.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                <p className="text-sm font-medium leading-relaxed">
                  <span className="font-black">Précision :</span> Plus la consultation est détaillée, plus la note SOAP sera pertinente.
                </p>
              </li>
            </ul>

            <div className="pt-4 border-t border-white/10 mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Format de sortie : SOAP Standard</p>
            </div>
          </div>
        </div>

        {/* Affichage des Résultats */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm h-[750px] flex flex-col overflow-hidden">
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
               {/* Zone de Transcription */}
               <div className="space-y-6 mb-16">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Transcription de la Session
                    </h4>
                    {isRecording && <span className="flex items-center gap-2 text-[10px] font-black text-red-500 animate-pulse uppercase">Enregistrement en cours</span>}
                  </div>
                  <p className={`text-2xl font-medium leading-relaxed ${isRecording ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                    {transcript || (isRecording ? "Écoute active..." : "La transcription s'affichera ici en temps réel dès que vous commencerez l'enregistrement.")}
                  </p>
               </div>

               {/* Zone SOAP */}
               {summary && (
                  <div className="mt-12 pt-12 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 flex items-center gap-2">
                        <ListChecks className="w-3.5 h-3.5" /> Rapport SOAP Automatisé
                      </h4>
                      <div className="flex gap-3">
                        <button 
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copié !' : 'Copier tout'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap leading-[1.8] text-xl">
                      {summary}
                    </div>
                    <div className="mt-8 flex justify-center gap-6">
                       <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><ShieldCheck className="w-3.5 h-3.5" /> Chiffrement Local</span>
                       <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5" /> Gemini Flash Engine</span>
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
