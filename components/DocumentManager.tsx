import React, { useRef, useState, useMemo } from 'react';
import { Upload, FileText, Trash2, ShieldCheck, Search, Loader2, Zap, AlertCircle, Filter, ImageIcon, Eye, Layers } from 'lucide-react';
import { HealthDocument } from '../types';
import { fileToBase64, anonymizeText } from '../utils/anonymizer';
import { analyzeClinicalDocument } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { generateUUID } from '../utils/uuid';

interface DocumentManagerProps {
  documents: HealthDocument[];
  setDocuments: (docs: HealthDocument[] | ((prev: HealthDocument[]) => HealthDocument[])) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

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
        id: generateUUID(),
        name: file.name,
        type: file.type,
        content: content,
        mimeType: file.type,
        timestamp: Date.now(),
        anonymized: true,
        pageCount: file.type === 'application/pdf' ? Math.floor(Math.random() * 5) + 1 : 1 // Simulation de pages
      };

      newDocs.push(doc);
      StorageService.logAudit('Upload Document', 'low', doc.id);
    }

    setDocuments(prev => [...newDocs, ...prev]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

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
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => doc.name.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [documents, filterQuery]);

  const selectedPreview = documents.find(d => d.id === previewId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input type="text" placeholder="Filtrer documents..." className="w-full pl-14 pr-7 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-700 dark:text-white" value={filterQuery} onChange={e => setFilterQuery(e.target.value)} />
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
          <Upload className="w-5 h-5" /> Importer
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*, .pdf, .txt" onChange={handleFileUpload} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
            <div className="flex justify-between mb-4">
              <div className={`p-3 rounded-xl ${doc.mimeType.startsWith('image/') ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {doc.mimeType.startsWith('image/') ? <ImageIcon className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setPreviewId(doc.id)} className="p-2 text-slate-400 hover:text-indigo-500"><Eye className="w-4 h-4" /></button>
                <button onClick={() => removeDoc(doc.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <h4 className="font-black text-slate-800 dark:text-white truncate text-sm mb-1">{doc.name}</h4>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">
              {new Date(doc.timestamp).toLocaleDateString()} • {doc.pageCount || 1} PAGE(S)
            </span>

            {doc.analysisSummary ? (
              <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-3 italic">{doc.analysisSummary}</p>
              </div>
            ) : (
              <div className="mt-auto flex items-center gap-2 text-slate-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">IA en lecture...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {previewId && selectedPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in" onClick={() => setPreviewId(null)}>
          <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 overflow-hidden">
            {selectedPreview.mimeType.startsWith('image/') ? (
              <img src={`data:${selectedPreview.mimeType};base64,${selectedPreview.content}`} className="max-h-[60vh] mx-auto rounded-2xl mb-8" />
            ) : (
              <div className="max-h-[60vh] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap mb-8">
                {selectedPreview.content}
              </div>
            )}
            <h5 className="text-xl font-black text-slate-800 dark:text-white mb-4">Synthèse IA - {selectedPreview.name}</h5>
            <p className="text-sm text-slate-500 leading-relaxed italic">{selectedPreview.analysisSummary || "En attente d'analyse..."}</p>
            <button className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase" onClick={() => setPreviewId(null)}>Fermer l'aperçu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;