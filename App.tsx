
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import PatientManager from './components/PatientManager.tsx';
import DatabaseViewer from './components/DatabaseViewer.tsx';
import DocumentManager from './components/DocumentManager.tsx';
import LogViewer from './components/LogViewer.tsx';
import Scribe from './components/Scribe.tsx';
import SecurityAudit from './components/SecurityAudit.tsx';
import { StorageService } from './services/storageService.ts';
import { Doctor, Patient, HealthDocument, AdviceLog } from './types.ts';
import { supabase } from './lib/supabase';
import { DatabaseService } from './services/databaseService';

const App: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [globalDocs, setGlobalDocs] = useState<HealthDocument[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // State pour la sauvegarde automatique
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  useEffect(() => {
    // Initial data from Supabase Auth
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await DatabaseService.getProfile(session.user.id);
        if (profile) {
          setDoctor({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            password: '',
            specialty: profile.specialty,
            licenseNumber: profile.license_number,
            isVerified: profile.is_verified
          });
        }
      }
      setIsInitializing(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await DatabaseService.getProfile(session.user.id);
        if (profile) {
          setDoctor({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            password: '',
            specialty: profile.specialty,
            licenseNumber: profile.license_number,
            isVerified: profile.is_verified
          });
        }
      } else {
        setDoctor(null);
      }
    });

    // Local data fallback
    const savedPatients = StorageService.getPatients();
    const savedGlobalDocs = StorageService.getGlobalDocs();
    setPatients(savedPatients);
    setGlobalDocs(savedGlobalDocs);

    return () => subscription.unsubscribe();
  }, []);

  // Heartbeat de sauvegarde toutes les 5 minutes
  useEffect(() => {
    if (!doctor) return;

    const pulse = setInterval(() => {
      handleForceSave();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(pulse);
  }, [doctor, patients, globalDocs]);

  const handleForceSave = () => {
    setSaveStatus('saving');
    try {
      StorageService.savePatients(patients);
      StorageService.saveGlobalDocs(globalDocs);
      setLastSaved(Date.now());
      setTimeout(() => setSaveStatus('saved'), 1500);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const saveGlobalDocs = (docsOrFn: HealthDocument[] | ((prev: HealthDocument[]) => HealthDocument[])) => {
    setGlobalDocs(prev => {
      const next = typeof docsOrFn === 'function' ? docsOrFn(prev) : docsOrFn;
      StorageService.saveGlobalDocs(next);
      setLastSaved(Date.now());
      return next;
    });
  };

  const handleAddLog = (patientId: string, log: AdviceLog) => {
    const updatedPatients = StorageService.addConsultationToPatient(patientId, log);
    setPatients(updatedPatients);
    setLastSaved(Date.now());
  };

  const allLogs = patients.flatMap(p => p.consultations || []).sort((a, b) => b.timestamp - a.timestamp);

  if (isInitializing) return null;

  if (!doctor) {
    return <Auth onComplete={(doc) => {
      setDoctor(doc);
    }} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      doctorName={doctor.name}
      specialty={doctor.specialty}
      saveStatus={saveStatus}
      lastSaved={lastSaved}
    >
      {activeTab === 'dashboard' && <Dashboard doctor={doctor} patients={patients} addLog={handleAddLog} />}
      {activeTab === 'scribe' && <Scribe />}
      {activeTab === 'patients' && (
        <PatientManager
          patients={patients}
          setPatients={(pOrFn) => {
            setPatients(prev => {
              const next = typeof pOrFn === 'function' ? pOrFn(prev) : pOrFn;
              StorageService.savePatients(next);
              setLastSaved(Date.now());
              return next;
            });
          }}
          doctor={doctor}
        />
      )}
      {activeTab === 'database' && <DatabaseViewer specialty={doctor.specialty} />}
      {activeTab === 'audit' && <SecurityAudit />}
      {activeTab === 'logs' && <LogViewer logs={allLogs} />}

      {activeTab === 'documents' && (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="max-w-5xl auto">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Mes Protocoles & Ressources</h3>
                <p className="text-slate-400 font-medium mb-12 max-w-xl leading-relaxed">
                  Bibliothèque transversale utilisée comme contexte additionnel par le moteur expert.
                </p>
                <DocumentManager documents={globalDocs} setDocuments={saveGlobalDocs} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
