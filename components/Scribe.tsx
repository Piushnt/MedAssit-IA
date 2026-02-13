
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Activity, ShieldCheck, Copy, Check, Waves, Volume2, Wand2, ClipboardType, FileText, AlertCircle, MonitorPlay, Zap, ArrowRight, Save } from 'lucide-react';
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
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

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

  // Helper to split SOAP summary into sections if it follows the pattern
  const renderSOAPContent = (content: string) => {
    const sections = content.split(/(?=SUBJECTIF|OBJECTIF|ANALYSE|PLAN|ASSESSMENT)/i);
    if (sections.length <= 1) return <p className="leading-[2] text-xl font-medium">{content}</p>;

    return (
      <div className="space-y-10">
        {sections.map((section, idx) => {
          const lines = section.trim().split('\n');
          const title = lines[0];
          const body = lines.slice(1).join('\n');
          return (
            <div key={idx} className="group/section animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1.5 bg-indigo-500 rounded-full"></div>
                <h5 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{title}</h5>
              </div>
              <div className="pl-5 text-lg text-slate-700 dark:text-slate-200 leading-[1.8] font-medium whitespace-pre-wrap">
                {body}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusColor = () => {
    if (isRecording) return 'bg-red-500';
    if (isProcessing) return 'bg-amber-500';
    if (summary) return 'bg-emerald-500';
    return 'bg-slate-300';
  };

  const getStatusLabel = () => {
    if (isRecording) return 'Enregistrement en direct';
    if (isProcessing) return 'Analyse intelligente...';
    if (summary) return 'Note SOAP prête';
    if (transcript) return 'Capture terminée';
    return 'En attente';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${isRecording || isProcessing ? 'animate-pulse' : ''}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{getStatusLabel()}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Confidentialité garantie</span>
          </div>
          <div className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">ID Session: {new Date().getTime().toString(36).toUpperCase()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
            <div className={`w-36 h-36 rounded-full mx-auto flex items-center justify-center mb-10 relative transition-all duration-500 ${isRecording ? 'scale-110' : ''}`}>
               {isRecording && (
                 <>
                   <div className="absolute inset-[-25%] bg-red-500 rounded-full animate-ping opacity-5"></div>
                   <div className="absolute inset-[-15%] bg-red-500 rounded-full animate-pulse opacity-10"></div>
                   <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-10 px-5 py-2.5 bg-slate-900 dark:bg-white rounded-full shadow-2xl">
                     <div className="w-1.5 bg-red-500 animate-[bounce_0.6s_infinite_0s] rounded-full h-2"></div>
                     <div className="w-1.5 bg-red-500 animate-[bounce_0.6s_infinite_0.1s] rounded-full h-6"></div>
                     <div className="w-1.5 bg-red-500 animate-[bounce_0.6s_infinite_0.2s] rounded-full h-4"></div>
                     <div className="w-1.5 bg-red-500 animate-[bounce_0.6s_infinite_0.3s] rounded-full h-7"></div>
                     <div className="w-1.5 bg-red-500 animate-[bounce_0.6s_infinite_0.4s] rounded-full h-5"></div>
                   </div>
                 </>
               )}
               <div className={`w-full h-full rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-2xl ${isRecording ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {isRecording ? <Mic className="w-16 h-16" /> : <MicOff className="w-16 h-16" />}
               </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={toggleRecording} 
                className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 transition-all shadow-xl active:scale-95 ${
                  isRecording 
                    ? 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white' 
                    : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {isRecording ? "Terminer la séance" : "Commencer l'écoute"}
              </button>

              {transcript && !isRecording && !summary && (
                <div className="flex flex-col gap-3 animate-in slide-in-from-top-4 duration-500">
                  <button 
                    onClick={handleImproveTranscript} 
                    disabled={isCleaning || isProcessing} 
                    className="w-full py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-white/10 font-black text-xs flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isCleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    {isCleaning ? 'Nettoyage IA...' : 'Affiner le texte brut'}
                  </button>
                  <button 
                    onClick={handleSummarize} 
                    disabled={isProcessing} 
                    className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50 group"
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                    Structurer SOAP
                  </button>
                </div>
              )}
              
              {summary && (
                <button 
                  onClick={() => { setTranscript(''); setSummary(''); }} 
                  className="w-full py-4 text-slate-400 hover:text-indigo-500 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" /> Nouvelle Consultation
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden border border-white/5">
            <div className="absolute -top-6 -right-6 p-8 opacity-10">
              <Waves className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <ClipboardType className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">Protocole Scribe Pro</h4>
            </div>

            <div className="space-y-6 relative z-10">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">L'algorithme identifie automatiquement :</p>
              <ul className="space-y-4">
                {[
                  { label: "Anamnèse & Symptômes", icon: ArrowRight },
                  { label: "Observations Cliniques", icon: ArrowRight },
                  { label: "Hypothèses & Diagnostic", icon: ArrowRight },
                  { label: "Stratégie Thérapeutique", icon: ArrowRight }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold">
                    <item.icon className="w-3.5 h-3.5 text-indigo-500" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm h-[820px] flex flex-col overflow-hidden relative">
            
            {/* Header Content Action */}
            <div className="px-10 py-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isRecording ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                  {isRecording ? <MonitorPlay className="w-5 h-5 animate-pulse" /> : <FileText className="w-5 h-5" />}
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Poste de Transcription</h4>
              </div>
              
              {summary && (
                <button 
                  onClick={copyToClipboard} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                    copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier la Note SOAP'}
                </button>
              )}
            </div>

            <div ref={scrollRef} className="p-10 flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
               <div className="space-y-8 mb-16">
                  {isRecording && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase animate-pulse mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Écoute active en cours...
                    </div>
                  )}
                  
                  <p className={`text-2xl font-medium leading-[1.8] tracking-tight transition-all duration-500 ${isRecording ? 'text-slate-800 dark:text-white' : transcript ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700 italic'}`}>
                    {transcript || "Le flux clinique s'affichera ici..."}
                  </p>
               </div>

               {isProcessing && (
                 <div className="py-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-10">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <Loader2 className="w-20 h-20 text-indigo-500 animate-spin relative z-10" />
                      <Sparkles className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h5 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Moteur Expert en Action</h5>
                    <p className="text-slate-400 font-medium text-lg text-center max-w-sm">Structuration sémantique des données cliniques et mise en forme SOAP.</p>
                 </div>
               )}

               {summary && !isProcessing && (
                  <div className="mt-12 pt-12 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-100 shadow-inner relative group/result">
                      <div className="absolute top-8 right-8 p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm opacity-0 group-hover/result:opacity-100 transition-opacity cursor-pointer" onClick={copyToClipboard} title="Copier rapidement">
                        <Copy className="w-4 h-4 text-slate-400" />
                      </div>
                      {renderSOAPContent(summary)}
                    </div>
                    
                    <div className="mt-10 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-6 py-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                        <Check className="w-4 h-4" /> Traitement finalisé avec succès
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade Médical</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <div key={s} className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-8 bg-amber-50 dark:bg-amber-900/20 rounded-[2.5rem] border border-amber-100 dark:border-amber-500/10 flex items-start gap-5">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-amber-600 shadow-sm flex-shrink-0">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h6 className="text-[11px] font-black text-amber-800 dark:text-amber-200 uppercase tracking-widest mb-1">Clause de Validation Clinique</h6>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/60 font-medium leading-relaxed italic">
                          Cette synthèse a été générée par un agent IA de grade clinique. Le praticien traitant demeure l'unique responsable de la validation des données et de l'intégration au Dossier Patient Informatisé (DPI).
                        </p>
                      </div>
                    </div>
                  </div>
               )}
            </div>
            
            {!transcript && !isRecording && !isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                <div className="relative mb-8">
                  <Waves className="w-24 h-24 text-slate-200 dark:text-slate-800" />
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl"></div>
                </div>
                <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700">En attente d'entrée audio</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default Scribe;
