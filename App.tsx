
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

const App: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [globalDocs, setGlobalDocs] = useState<HealthDocument[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedDoc = StorageService.getDoctor();
    const savedPatients = StorageService.getPatients();
    const savedGlobalDocs = StorageService.getGlobalDocs();
    
    setDoctor(savedDoc);
    setPatients(savedPatients);
    setGlobalDocs(savedGlobalDocs);
    setIsInitializing(false);
  }, []);

  // Fix: Updated to support functional updates for DocumentManager to prevent race conditions during multiple sync updates
  const saveGlobalDocs = (docsOrFn: HealthDocument[] | ((prev: HealthDocument[]) => HealthDocument[])) => {
    setGlobalDocs(prev => {
      const next = typeof docsOrFn === 'function' ? docsOrFn(prev) : docsOrFn;
      StorageService.saveGlobalDocs(next);
      return next;
    });
  };

  const handleAddLog = (patientId: string, log: AdviceLog) => {
    const updatedPatients = StorageService.addConsultationToPatient(patientId, log);
    setPatients(updatedPatients);
  };

  const allLogs = patients.flatMap(p => p.consultations || []).sort((a, b) => b.timestamp - a.timestamp);

  if (isInitializing) return null;

  if (!doctor) {
    return <Auth onComplete={(doc) => {
      StorageService.saveDoctor(doc);
      setDoctor(doc);
    }} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      doctorName={doctor.name}
      specialty={doctor.specialty}
    >
      {activeTab === 'dashboard' && <Dashboard doctor={doctor} patients={patients} addLog={handleAddLog} />}
      {activeTab === 'scribe' && <Scribe />}
      {activeTab === 'patients' && (
        <PatientManager 
          patients={patients} 
          // Fix: Updated to support functional updates from PatientManager to safely update specific patient data
          setPatients={(pOrFn) => {
            setPatients(prev => {
              const next = typeof pOrFn === 'function' ? pOrFn(prev) : pOrFn;
              StorageService.savePatients(next);
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
                  Bibliothèque transversale utilisée comme contexte additionnel par l'IA.
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
