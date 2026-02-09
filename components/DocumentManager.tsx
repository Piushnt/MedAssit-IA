
import React, { useRef, useState, useMemo } from 'react';
import { Upload, FileText, Trash2, ShieldCheck, Search, Loader2, Zap, AlertCircle, Filter, ImageIcon, Eye } from 'lucide-react';
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
        anonymized: true
      };

      newDocs.push(doc);
      StorageService.logAudit('Upload Document', 'low', doc.id);
    }

    setDocuments(prev => [...newDocs, ...prev]);
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
    if (confirm("Supprimer ce document définitivement ?")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      StorageService.logAudit('Suppression Document', 'medium', id);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      doc.analysisSummary?.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [documents, filterQuery]);

  const selectedPreview = documents.find(d => d.id === previewId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher dans les rapports ou titres..."
            className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl outline-none font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-sm flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 whitespace-nowrap group"
        >
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
          Importer Documents
        </button>
      </div>

      <div 
        className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-6 group cursor-pointer shadow-sm relative overflow-hidden" 
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
        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] group-hover:scale-110 transition-transform shadow-inner">
          {isUploading ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-indigo-500" />}
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">Déposer vos fichiers cliniques</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Supporte JPG, PNG, PDF & Text. Chiffrement AES-256 actif.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDocs.map((doc: any) => (
          <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col border-b-4 border-b-transparent hover:border-b-indigo-500">
            {analyzingId === doc.id && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-in fade-in">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">IA en cours de lecture...</span>
              </div>
            )}
            
            <div className="p-7 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl shadow-inner ${doc.mimeType.startsWith('image/') ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                  {doc.mimeType.startsWith('image/') ? <ImageIcon className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                </div>
                <div className="flex gap-2">
                  {doc.mimeType.startsWith('image/') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewId(doc.id); }}
                      className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeDoc(doc.id); }}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {doc.mimeType.startsWith('image/') && (
                <div className="w-full h-32 mb-6 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-50 dark:border-white/5">
                  <img 
                    src={`data:${doc.mimeType};base64,${doc.content}`} 
                    alt={doc.name} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              )}

              <h4 className="font-black text-slate-800 dark:text-white truncate mb-1 text-lg leading-tight" title={doc.name}>{doc.name}</h4>
              <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>{new Date(doc.timestamp).toLocaleDateString()}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>{Math.round(doc.content.length / 1024)} KB</span>
              </div>

              {doc.analysisSummary ? (
                <div className="mt-auto p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Synthèse Clinique IA</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-4 italic">
                    {doc.analysisSummary}
                  </p>
                </div>
              ) : (
                <div className="mt-auto pt-6 flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce delay-150"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Extraction en attente</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewId && selectedPreview && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in"
          onClick={() => setPreviewId(null)}
        >
          <div className="max-w-4xl max-h-full relative animate-in zoom-in-95 duration-300">
            <img 
              src={`data:${selectedPreview.mimeType};base64,${selectedPreview.content}`} 
              className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl border border-white/10"
              alt="Preview" 
            />
            <div className="mt-8 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-white/10">
              <h5 className="text-xl font-black text-slate-800 dark:text-white mb-2">{selectedPreview.name}</h5>
              <p className="text-slate-400 font-medium text-sm">{selectedPreview.analysisSummary || "Pas d'analyse disponible pour cet aperçu."}</p>
            </div>
            <button 
              className="absolute -top-12 right-0 text-white font-black uppercase text-xs tracking-widest hover:text-red-400 transition-colors"
              onClick={() => setPreviewId(null)}
            >
              Fermer l'aperçu [ESC]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
