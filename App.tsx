
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import PatientManager from './components/PatientManager.tsx';
import DatabaseViewer from './components/DatabaseViewer.tsx';
import DocumentManager from './components/DocumentManager.tsx';
import LogViewer from './components/LogViewer.tsx';
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
    // Charge les documents globaux (non liés à un patient spécifique)
    const savedDocs = JSON.parse(localStorage.getItem('med_global_docs') || '[]');
    
    setDoctor(savedDoc);
    setPatients(savedPatients);
    setGlobalDocs(savedDocs);
    setIsInitializing(false);
  }, []);

  const saveGlobalDocs = (docs: HealthDocument[]) => {
    setGlobalDocs(docs);
    localStorage.setItem('med_global_docs', JSON.stringify(docs));
  };

  const allLogs = patients.flatMap(p => p.consultations).sort((a, b) => b.timestamp - a.timestamp);

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
      {activeTab === 'dashboard' && <Dashboard doctor={doctor} patients={patients} />}
      
      {activeTab === 'patients' && (
        <PatientManager 
          patients={patients} 
          setPatients={(p) => {
            setPatients(p);
            StorageService.savePatients(p);
          }} 
          doctor={doctor}
        />
      )}
      
      {activeTab === 'database' && <DatabaseViewer specialty={doctor.specialty} />}
      
      {activeTab === 'documents' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Documents Généraux</h3>
            <p className="text-slate-400 text-sm mb-8">Uploadez ici vos protocoles de service ou documents transversaux.</p>
            <DocumentManager 
              documents={globalDocs} 
              setDocuments={saveGlobalDocs} 
            />
          </div>
        </div>
      )}
      
      {activeTab === 'logs' && <LogViewer logs={allLogs} />}
    </Layout>
  );
};

export default App;
