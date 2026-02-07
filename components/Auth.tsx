
import React, { useState, useRef } from 'react';
import { Stethoscope, ShieldCheck, Upload, ArrowRight, CheckCircle2, Loader2, Camera, Activity } from 'lucide-react';
import { Doctor } from '../types';
import { fileToBase64 } from '../utils/anonymizer';

interface AuthProps {
  onComplete: (doctor: Doctor) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [form, setForm] = useState({ name: '', specialty: 'Médecine Générale', license: '' });
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const specialties = [
    "Médecine Générale", 
    "Cardiologie", 
    "Endocrinologie", 
    "Neurologie", 
    "Pédiatrie", 
    "Radiologie"
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setIdPhoto(base64);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erreur lors de l'import de l'image. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    // Validation validation
    if (!form.name.trim() || !form.license.trim()) {
      alert("Veuillez remplir votre nom et votre numéro RPPS.");
      return;
    }

    setIsFinishing(true);

    const newDoctor: Doctor = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      specialty: form.specialty,
      licenseNumber: form.license.trim(),
      isVerified: true,
      idCardPhoto: idPhoto || undefined
    };

    // Use a small timeout to ensure the UI feels responsive before the swap
    setTimeout(() => {
      console.debug("Finalizing registration for:", newDoctor.name);
      onComplete(newDoctor);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor - Matching Dashboard Ambient */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.06] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-slate-200/60 dark:shadow-none border border-white/50 dark:border-white/5 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-slate-900 dark:bg-slate-950 p-12 text-white relative">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Stethoscope className="w-48 h-48 rotate-12" />
          </div>
          
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-indigo-500 p-3.5 rounded-[1.25rem] shadow-2xl shadow-indigo-500/40">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">MedAssist Pro</h1>
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">Plateforme Certifiée</span>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight leading-tight">Accès Sécurisé</h2>
          <p className="text-slate-400 mt-3 font-medium text-lg leading-relaxed">Identifiez-vous pour accéder à vos outils de diagnostic IA.</p>
        </div>

        <div className="p-12">
          {/* Progress Indicator */}
          <div className="flex gap-4 mb-14">
            <div className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-indigo-500 shadow-lg shadow-indigo-200' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
            <div className={`h-2.5 flex-1 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-indigo-500 shadow-lg shadow-indigo-200' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
          </div>

          {step === 1 ? (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-2">Identité Professionnelle</label>
                  <input 
                    type="text" 
                    placeholder="Dr. Sarah Martin" 
                    className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 text-lg"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-2">Spécialité</label>
                  <div className="relative">
                    <select 
                      className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all font-bold text-slate-800 dark:text-white appearance-none cursor-pointer text-lg"
                      value={form.specialty} 
                      onChange={e => setForm({...form, specialty: e.target.value})}
                    >
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-2">Numéro RPPS</label>
                  <input 
                    type="text" 
                    placeholder="1010XXXXXXXX" 
                    maxLength={11}
                    className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 text-lg tracking-widest"
                    value={form.license} 
                    onChange={e => setForm({...form, license: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.name || form.license.length < 5}
                className="w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.75rem] font-black text-xl flex items-center justify-center gap-5 hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-30 group active:scale-[0.97]"
              >
                Suivant <ArrowRight className="w-7 h-7 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-right-12 duration-500 text-center">
              <div className="space-y-5">
                {/* Fixed the truncated div and completed the Step 2 UI */}
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2.75rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100/50 dark:border-emerald-500/20">
                  {isFinishing ? (
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Validation Professionnelle</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Votre profil est prêt. En cliquant sur terminer, vous certifiez l'exactitude des informations fournies.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                 <button 
                  onClick={handleFinish}
                  disabled={isFinishing}
                  className="w-full py-6 bg-emerald-500 text-white rounded-[1.75rem] font-black text-xl flex items-center justify-center gap-5 hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.97]"
                >
                  {isFinishing ? "Initialisation..." : "Terminer l'accès"} <CheckCircle2 className="w-7 h-7" />
                </button>
                
                <button 
                  onClick={() => setStep(1)}
                  disabled={isFinishing}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Retour
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Added missing default export
export default Auth;
