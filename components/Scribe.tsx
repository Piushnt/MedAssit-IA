
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, FileText, Save, Sparkles, Activity, ShieldCheck, Copy, Check, History, RotateCcw, Download } from 'lucide-react';
import { generateSOAPNote } from '../services/geminiService';
import { StorageService } from '../services/storageService';

const Scribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, summary]);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSOAP = () => {
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const content = `COMPTE-RENDU DE CONSULTATION (SOAP)\nDate: ${new Date().toLocaleString()}\n\n${summary}\n\n--- Document généré par MedAssist Pro ---`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SOAP_Note_${date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            Scribe Médical Ambiant
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-full uppercase tracking-widest">Live Flash-3</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Capturez la consultation, l'IA s'occupe du dossier patient.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Confidentialité Totale</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-1000 ${isRecording ? 'bg-red-500' : 'bg-transparent'}`}></div>
            
            <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-6 transition-all duration-500 relative ${isRecording ? 'scale-110' : ''}`}>
               {isRecording && (
                 <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
               )}
               <div className={`w-full h-full rounded-full flex items-center justify-center z-10 ${isRecording ? 'bg-red-500 text-white shadow-2xl shadow-red-500/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {isRecording ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12" />}
               </div>
            </div>

            <div className="space-y-2 mb-8">
              <h4 className="font-black text-slate-800 dark:text-white text-xl">
                {isRecording ? "Enregistrement en cours" : "Prêt à écouter"}
              </h4>
              <p className="text-sm text-slate-400 font-medium px-4">
                {isRecording ? "L'IA analyse les nuances de l'échange..." : "Cliquez sur le bouton pour démarrer la session."}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={toggleRecording}
                className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-xl ${
                  isRecording 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                }`}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                {isRecording ? "Arrêter la session" : "Démarrer Scribe"}
              </button>

              {transcript && !isRecording && (
                <button 
                  onClick={handleSummarize}
                  disabled={isProcessing}
                  className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  Structurer Note SOAP
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
             <div className="flex items-center gap-3 text-slate-400 mb-2">
               <History className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Conseils d'utilisation</span>
             </div>
             <ul className="space-y-3 text-xs font-medium text-slate-500 dark:text-slate-400">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                 Posez votre téléphone ou PC entre vous et le patient.
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                 Dictez les constantes à haute voix (ex: "Tension 12/8").
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                 Concluez par le plan de soin pour une meilleure note.
               </li>
             </ul>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="flex border-b border-slate-50 dark:border-white/5">
              <div className="flex-1 px-8 py-5 border-r border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transcription en direct</span>
                  </div>
                  {transcript && (
                    <button onClick={() => { setTranscript(''); setSummary(''); }} className="text-slate-400 hover:text-red-500 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 bg-white dark:bg-slate-900">
              <div className="space-y-6">
                <p className={`text-xl font-medium leading-relaxed ${isRecording ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                  {transcript || (isRecording ? "Capture de l'audio..." : "La transcription apparaîtra ici une fois l'enregistrement lancé.")}
                </p>
                {isRecording && (
                   <div className="flex gap-1.5 mt-4">
                     {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                   </div>
                )}
              </div>

              {summary && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-6 pt-10 border-t border-slate-50 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-white tracking-tight">Note SOAP Structurée</h4>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all font-bold text-sm shadow-sm"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copié" : "Copier"}
                      </button>
                      <button 
                        onClick={exportSOAP}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl transition-all font-bold text-sm shadow-sm hover:bg-slate-800"
                      >
                        <Download className="w-4 h-4" />
                        Exporter .txt
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap leading-[1.8] text-lg shadow-inner">
                    {summary}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
               <div className="flex items-center gap-4">
                 <span>Moteur : Gemini 3 Flash</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                 <span>Langue : FR-FR</span>
               </div>
               <div className="flex items-center gap-2 text-emerald-500">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 Connexion Sécurisée Active
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scribe;
