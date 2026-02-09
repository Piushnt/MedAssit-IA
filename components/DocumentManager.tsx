
import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, ShieldCheck, Search, Loader2, Zap, AlertCircle, Filter } from 'lucide-react';
import { HealthDocument } from '../types';
import { fileToBase64, anonymizeText } from '../utils/anonymizer';
import { analyzeClinicalDocument } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface DocumentManagerProps {
  documents: HealthDocument[];
  setDocuments: (docs: HealthDocument[]) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newDocs: HealthDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      
      let content = base64;
      if (file.type === 'text/plain') {
         const reader = new FileReader();
         const text = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
         });
         content = anonymizeText(text);
      }

      const doc: HealthDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        content: content,
        mimeType: file.type,
        timestamp: Date.now(),
        anonymized: true
      };

      newDocs.push(doc);
      StorageService.logAudit('Upload Document', 'low', doc.id);
    }

    const updatedDocs = [...newDocs, ...documents];
    setDocuments(updatedDocs);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Trigger analysis for new docs
    for (const doc of newDocs) {
      triggerAnalysis(doc.id, doc);
    }
  };

  const triggerAnalysis = async (id: string, doc: HealthDocument) => {
    setAnalyzingId(id);
    try {
      const summary = await analyzeClinicalDocument(doc);
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, analysisSummary: summary } : d));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const removeDoc = (id: string) => {
    if (confirm("Supprimer ce document ?")) {
      setDocuments(documents.filter(d => d.id !== id));
      StorageService.logAudit('Suppression Document', 'medium', id);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    doc.analysisSummary?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher dans les rapports IA ou titres..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl outline-none font-bold text-sm text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/10 active:scale-95 whitespace-nowrap"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          Importer Fichiers
        </button>
      </div>

      <div 
        className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer shadow-sm" 
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*, .pdf, .txt" 
          onChange={handleFileUpload} 
        />
        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform">
          {isUploading ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 text-indigo-500" />}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Glisser-déposer les documents</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Images, PDFs ou comptes-rendus. Anonymisation active.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc: any) => (
          <div key={doc.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
            {analyzingId === doc.id && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">IA en cours...</span>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${doc.type.includes('image') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeDoc(doc.id); }}
                className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white truncate mb-1" title={doc.name}>{doc.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">
              {new Date(doc.timestamp).toLocaleDateString()} • {Math.round(doc.content.length / 1024)} KB
            </p>

            {doc.analysisSummary ? (
              <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Synthèse IA</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-4">
                  {doc.analysisSummary}
                </p>
              </div>
            ) : (
              <div className="mt-auto pt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">En attente d'analyse</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentManager;
