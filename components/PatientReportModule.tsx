import React, { useState, useEffect } from 'react';
import { FileText, Download, User, Activity, History, Shield, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PDFService } from '../services/PDFService';
import { Doctor, Patient } from '../types';

interface PatientReportModuleProps {
    doctor: Doctor;
    patients: Patient[];
}

const PatientReportModule: React.FC<PatientReportModuleProps> = ({ doctor, patients }) => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    useEffect(() => {
        if (selectedPatientId) {
            fetchAnalyses();
        }
    }, [selectedPatientId]);

    const fetchAnalyses = async () => {
        const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('doctor_id', doctor.id)
            // Note: In a real app we'd filter by patient_id too if available
            .order('created_at', { ascending: false });

        if (data) setAnalyses(data);
    };

    const handleExport = async () => {
        if (!selectedPatientId) return;
        setIsGenerating(true);
        await PDFService.generatePDF('report-template', `Rapport_Clinique_${selectedPatient?.nomAnonymise}_${new Date().toLocaleDateString()}.pdf`);
        setIsGenerating(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                            <FileText className="text-indigo-500" /> Dossier Patient Consolidé
                        </h3>
                        <p className="text-slate-400 font-medium text-sm">Générez un rapport hospitalier HD incluant l'historique IA et les constantes.</p>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={!selectedPatientId || isGenerating}
                        className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                    >
                        {isGenerating ? <Activity className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        Exporter en PDF HD
                    </button>
                </div>

                <div className="max-w-md space-y-2 mb-12">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <User className="w-3 h-3" /> Choisir le Dossier Patient
                    </label>
                    <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">-- Sélectionner un patient --</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.nomAnonymise} ({p.age} ans)</option>
                        ))}
                    </select>
                </div>

                {selectedPatientId ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-4">Informations de base</span>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase">Identifiant</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{selectedPatient?.nomAnonymise}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase">Âge</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{selectedPatient?.age} ans</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase">Sexe</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{selectedPatient?.sexe}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase">Antécédents</p>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {selectedPatient?.antecedents || "Aucun antécédent majeur déclaré."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-800/20 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                    <History className="w-4 h-4" /> Historique des Analyses IA ({analyses.length})
                                </h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {analyses.map((rec, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${rec.type === 'SOAP' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {rec.type}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mb-2">{rec.query || "Analyse automatique"}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                                                {rec.response}
                                            </p>
                                        </div>
                                    ))}
                                    {analyses.length === 0 && <p className="text-center py-10 text-slate-400 font-bold text-sm">Aucune analyse enregistrée pour ce patient.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem]">
                        <Info className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-black text-xl tracking-tight">Veuillez sélectionner un dossier pour l'analyse</p>
                    </div>
                )}
            </div>

            {/* Template PDF caché pour le Dossier Patient */}
            <div id="report-template" className="bg-white text-slate-900 p-16 w-[210mm] min-h-[297mm] absolute left-[-9999px]">
                <div className={PDFService.styles.watermark}>SECRET MÉDICAL</div>

                <div className={PDFService.styles.header}>
                    <div className={PDFService.styles.doctorInfo}>
                        <h1 className={PDFService.styles.doctorName}>Dr. {doctor.name}</h1>
                        <p className={PDFService.styles.doctorSpecialty}>{doctor.specialty}</p>
                    </div>
                    <div className={PDFService.styles.clinicName}>
                        BILAN CLINIQUE ÉLECTRONIQUE<br />SOUTIEN IA INTÉGRÉ
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl mb-12 flex justify-between items-center border border-slate-100">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> État Civil du Patient
                        </h2>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Patient</p>
                                <p className="text-xl font-black text-slate-900">{selectedPatient?.nomAnonymise}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Âge / Sexe</p>
                                <p className="text-lg font-bold text-slate-700">{selectedPatient?.age} ans / {selectedPatient?.sexe}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Date d'édition</p>
                        <p className="text-lg font-black text-indigo-600">{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="mb-12">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-l-4 border-slate-900 pl-4 mb-6">Résumé Clinique & Antécédents</h3>
                    <div className="p-6 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 leading-relaxed">
                        {selectedPatient?.antecedents || "Dossier vierge d'antécédents notables."}
                    </div>
                </div>

                <div className="mb-12">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-l-4 border-slate-900 pl-4 mb-6">Journal des Analyses IA</h3>
                    <div className="space-y-6">
                        {analyses.map((rec, i) => (
                            <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{rec.type}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs font-black text-slate-900 mb-3">{rec.query || "Note d'analyse"}</p>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {rec.response}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em] mb-4">Fin du Rapport Clinique</p>
                </div>

                <div className={PDFService.styles.footer}>
                    <span>Document généré par Med-Assist IA - ID Syst: {selectedPatientId.substr(0, 8).toUpperCase()}</span>
                    <span>Confidentiel - Réservé à l'usage médical</span>
                </div>
            </div>
        </div>
    );
};

export default PatientReportModule;
