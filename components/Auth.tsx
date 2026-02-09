
import React, { useState } from 'react';
import { Stethoscope, ShieldCheck, ArrowRight, Loader2, Activity, Lock, Mail, User, Fingerprint } from 'lucide-react';
import { Doctor } from '../types';
import { StorageService } from '../services/storageService';

interface AuthProps {
  onComplete: (doctor: Doctor) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    specialty: 'Médecine Générale', 
    license: '' 
  });

  const specialties = [
    "Médecine Générale", 
    "Cardiologie", 
    "Endocrinologie", 
    "Neurologie", 
    "Pédiatrie", 
    "Radiologie"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      try {
        if (isLogin) {
          const doctor = StorageService.login(form.name, form.password);
          if (doctor) {
            onComplete(doctor);
          } else {
            alert("Identifiants incorrects.");
          }
        } else {
          const newDoctor: Doctor = {
            id: (crypto as any).randomUUID(),
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            specialty: form.specialty,
            licenseNumber: form.license.trim(),
            isVerified: true
          };
          StorageService.signup(newDoctor);
          onComplete(newDoctor);
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.06] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-white/50 dark:border-white/5 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
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

          <h2 className="text-3xl font-black tracking-tight leading-tight">{isLogin ? 'Connexion Praticien' : 'Création de Compte'}</h2>
          <p className="text-slate-400 mt-3 font-medium text-lg leading-relaxed">
            {isLogin ? 'Accédez à votre espace clinique sécurisé.' : 'Rejoignez le réseau MedAssist Pro.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <User className="w-3 h-3" /> Nom Complet
              </label>
              <input 
                type="text" 
                required
                placeholder="Dr. Sarah Martin" 
                className="w-full px-7 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Professionnel
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="sarah.martin@sante.fr" 
                    className="w-full px-7 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white"
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Spécialité</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-white outline-none"
                      value={form.specialty} 
                      onChange={e => setForm({...form, specialty: e.target.value})}
                    >
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">N° RPPS</label>
                    <input 
                      type="text" 
                      required
                      placeholder="1010XXXXXXXX" 
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-white outline-none"
                      value={form.license} 
                      onChange={e => setForm({...form, license: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Mot de passe
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                className="w-full px-7 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white"
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : isLogin ? <Fingerprint className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            {isLogin ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <div className="text-center pt-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
