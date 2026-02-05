
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import LogViewer from './components/LogViewer';
import { StorageService } from './services/storageService';
import { HealthDocument, AdviceLog } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [logs, setLogs] = useState<AdviceLog[]>([]);

  // Initialize data on mount
  useEffect(() => {
    setDocuments(StorageService.getDocuments());
    setLogs(StorageService.getLogs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state with storage
  const updateDocuments = (docs: HealthDocument[]) => {
    setDocuments(docs);
    StorageService.saveDocuments(docs);
  };

  const addLog = (log: AdviceLog) => {
    setLogs(prev => [log, ...prev]);
    StorageService.saveLog(log);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          documents={documents} 
          addLog={addLog} 
        />
      )}
      {activeTab === 'documents' && (
        <DocumentManager 
          documents={documents} 
          setDocuments={updateDocuments} 
        />
      )}
      {activeTab === 'logs' && (
        <LogViewer 
          logs={logs} 
        />
      )}
    </Layout>
  );
};

export default App;
