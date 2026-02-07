
import React, { useState, useRef } from 'react';
import { Stethoscope, ShieldCheck, Upload, ArrowRight, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { Doctor } from '../types';
import { fileToBase64 } from '../utils/anonymizer';

interface AuthProps {
  onComplete: (doctor: Doctor) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({ name: '', specialty: 'Médecine Générale', license: '' });
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const specialties = [
    "Médecine Générale", 
    "Cardiologie", 
    "Endocrinologie", 
    "Neurologie", 
    "Pédiatrie", 
    "Gériatrie", 
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    onComplete({
      id: crypto.randomUUID(),
      name: form.name,
      specialty: form.specialty,
      licenseNumber: form.license,
      isVerified: true,
      idCardPhoto: idPhoto || undefined
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white relative z-10 overflow-hidden">
        <div className="bg-slate-900 p-10 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Stethoscope className="w-32 h-32 rotate-12" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold tracking-widest text-xs uppercase text-indigo-300">Portail Professionnel</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Bienvenue sur MedAssist-IA</h2>
          <p className="text-slate-400 mt-2 font-medium">Configurez votre cabinet numérique en quelques secondes.</p>
        </div>

        <div className="p-10">
          <div className="flex gap-2 mb-10">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-100'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-100'}`}></div>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Identité</label>
                  <input 
                    type="text" 
                    placeholder="Dr. Jean Dupont" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Spécialité</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 appearance-none"
                    value={form.specialty} 
                    onChange={e => setForm({...form, specialty: e.target.value})}
                  >
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Numéro RPPS / Adeli</label>
                  <input 
                    type="text" 
                    placeholder="1000XXXXXXXX" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                    value={form.license} 
                    onChange={e => setForm({...form, license: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!form.name || !form.license}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 group"
              >
                Continuer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Vérification de l'Ordre</h3>
                <p className="text-sm text-slate-500 px-6">Pour activer les fonctions de diagnostic IA, une preuve d'identité médicale est requise.</p>
              </div>

              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                  idPhoto 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange} 
                />
                
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                ) : idPhoto ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                ) : (
                  <Camera className="w-10 h-10 text-slate-300 mb-3 group-hover:text-indigo-400 transition-colors" />
                )}

                <span className={`text-sm font-bold ${idPhoto ? 'text-emerald-600' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                  {idPhoto ? "Document validé" : "Photo de votre carte CPS"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Max 5MB • JPG, PNG</span>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleFinish}
                  disabled={isUploading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Finaliser l'inscription
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Retour aux informations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Internal Activity Icon for UI consistency
const Activity = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export default Auth;
