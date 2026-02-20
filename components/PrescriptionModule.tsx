import React, { useState } from 'react';
import { Plus, Trash2, Download, User, Pill, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../services/databaseService';
import { PDFService } from '../services/PDFService';
import { Doctor, Patient } from '../types';

interface PrescriptionModuleProps {
    doctor: Doctor;
    patients: Patient[];
}

const PrescriptionModule: React.FC<PrescriptionModuleProps> = ({ doctor, patients }) => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [instructions, setInstructions] = useState('');
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
    const [isSaving, setIsSaving] = useState(false);

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        (newMeds[index] as any)[field] = value;
        setMedications(newMeds);
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const handleSaveAndExport = async () => {
        if (!selectedPatientId || medications[0].name === '') {
            alert("Veuillez sélectionner un patient et ajouter au moins un médicament.");
            return;
        }

        setIsSaving(true);
        try {
            await DatabaseService.savePrescription({
                doctor_id: doctor.id,
                patient_id: selectedPatientId,
                patient_name: selectedPatient?.nomAnonymise || 'Inconnu',
                medications,
                special_instructions: instructions
            });

            // Generate PDF after saving
            await PDFService.generatePDF('prescription-template', `Ordonnance_${selectedPatient?.nomAnonymise}_${new Date().toLocaleDateString()}.pdf`);

            alert("Ordonnance générée et sauvegardée !");
        } catch (error) {
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                    <Pill className="text-indigo-500" /> Nouvelle Ordonnance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <User className="w-3 h-3" /> Sélectionner un Patient
                        </label>
                        <select
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">-- Choisir un dossier --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.nomAnonymise} ({p.age} ans)</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            Date de l'ordonnance
                        </label>
                        <div className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-400">
                            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Traitements</h4>
                        <button
                            onClick={addMedication}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Ajouter
                        </button>
                    </div>

                    <div className="space-y-3">
                        {medications.map((med, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="md:col-span-5">
                                    <input
                                        placeholder="Nom du médicament"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
                                        value={med.name}
                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        placeholder="Dosage"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
                                        value={med.dosage}
                                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        placeholder="Fréquence"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
                                        value={med.frequency}
                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        placeholder="Durée"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white outline-none"
                                        value={med.duration}
                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-center justify-center">
                                    <button
                                        onClick={() => removeMedication(index)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 mb-10">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Instructions Spéciales
                    </label>
                    <textarea
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-white outline-none h-32 resize-none"
                        placeholder="Conseils hygiéno-diététiques, précautions particulières..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleSaveAndExport}
                    disabled={isSaving}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Download className="w-6 h-6 animate-bounce" /> : <Download className="w-6 h-6" />}
                    Générer & Sauvegarder l'Ordonnance
                </button>
            </div>

            {/* Template PDF caché */}
            <div id="prescription-template" className="bg-white text-slate-900 p-16 w-[210mm] min-h-[297mm] absolute left-[-9999px]">
                <div className={PDFService.styles.watermark}>MED-ASSIST-IA</div>

                <div className={PDFService.styles.header}>
                    <div className={PDFService.styles.doctorInfo}>
                        <h1 className={PDFService.styles.doctorName}>Dr. {doctor.name}</h1>
                        <p className={PDFService.styles.doctorSpecialty}>{doctor.specialty}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">N° RPPS: {doctor.licenseNumber}</p>
                    </div>
                    <div className={PDFService.styles.clinicName}>
                        DÉPARTEMENT MÉDICAL<br />CENTRE D'EXPERTISE IA
                    </div>
                </div>

                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Patient</span>
                        <p className="text-2xl font-black text-slate-900">{selectedPatient?.nomAnonymise}</p>
                        <p className="text-sm font-bold text-slate-400">{selectedPatient?.age} ans • {selectedPatient?.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fait à Paris</p>
                    </div>
                </div>

                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-1 px-0 bg-indigo-600"></div>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Prescription Médicale</h2>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dénomination</th>
                                <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Posologie</th>
                                <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durée</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medications.map((med, i) => (
                                <tr key={i} className="border-b border-slate-50">
                                    <td className="py-6 pr-4">
                                        <p className="text-lg font-black text-slate-900">{med.name}</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">{med.dosage}</p>
                                    </td>
                                    <td className="py-6 text-sm font-bold text-slate-700">{med.frequency}</td>
                                    <td className="py-6 text-sm font-black text-indigo-600">{med.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {instructions && (
                    <div className="bg-slate-50 p-8 rounded-3xl mb-16">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recommandations Thérapeutiques</h3>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                            « {instructions} »
                        </p>
                    </div>
                )}

                <div className="flex justify-end mt-20">
                    <div className="text-center w-64">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-12">Signature & Cachet</p>
                        <div className="h-24 flex items-center justify-center opacity-30 italic font-serif text-2xl border-b border-slate-200">
                            Dr. {doctor.name.split(' ').pop()}
                        </div>
                    </div>
                </div>

                <div className={PDFService.styles.footer}>
                    <span>Document certifié par Med-Assist IA - ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    <span>Page 1 / 1</span>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModule;
