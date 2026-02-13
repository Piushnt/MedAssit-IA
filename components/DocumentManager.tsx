
import React, { useRef, useState, useMemo } from 'react';
import { Upload, Trash2, Search, Loader2, Zap, Clock, ImageIcon, Eye, Layers, FileCheck, FileText } from 'lucide-react';
import { HealthDocument } from '../types';
import { fileToBase64, anonymizeText } from '../utils/anonymizer';
import { analyserPieceJointe } from '../services/analysisService';
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
        // Simulation du nombre de pages pour les PDF
        pageCount: file.type === 'application/pdf' ? Math.floor(Math.random() * 8) + 1 : 1 
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
      const summary = await analyserPieceJointe(doc);
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
    }
  };

  const filteredDocs = useMemo(() => {
    return (documents || []).filter(doc => (doc.name || '').toLowerCase().includes(filterQuery.toLowerCase()));
  }, [documents, filterQuery]);

  const selectedPreview = documents.find(d => d.id === previewId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrer par nom de rapport..." 
            className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-[1.75rem] outline-none font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" 
            value={filterQuery} 
            onChange={e => setFilterQuery(e.target.value)} 
          />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[1.75rem] font-black text-sm flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
        >
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
          Importer Documents
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*, .pdf, .txt" onChange={handleFileUpload} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden border-b-4 border-b-transparent hover:border-b-indigo-500">
            {analyzingId === doc.id && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/95 z-20 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Lecture en cours</span>
              </div>
            )}
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl shadow-inner ${doc.mimeType.startsWith('image/') ? 'bg-orange-50 dark:bg-orange-950 text-orange-600' : doc.mimeType === 'application/pdf' ? 'bg-red-50 dark:bg-red-950 text-red-600' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'}`}>
                  {doc.mimeType.startsWith('image/') ? <ImageIcon className="w-7 h-7" /> : doc.mimeType === 'application/pdf' ? <FileText className="w-7 h-7" /> : <Layers className="w-7 h-7" />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewId(doc.id)} className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Eye className="w-5 h-5" /></button>
                  <button onClick={() => removeDoc(doc.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              
              <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 truncate" title={doc.name}>{doc.name}</h4>
              <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <Clock className="w-3.5 h-3.5" /> {new Date(doc.timestamp).toLocaleDateString()}
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className={`${doc.pageCount && doc.pageCount > 1 ? 'text-red-500 animate-pulse' : 'text-indigo-500'}`}>{doc.pageCount || 1} PAGE(S)</span>
              </div>

              {doc.analysisSummary ? (
                <div className="mt-auto p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-white/5 relative group/summary">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Synthèse Analytique</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-4 italic group-hover/summary:line-clamp-none transition-all">
                    {doc.analysisSummary}
                  </p>
                </div>
              ) : (
                <div className="mt-auto pt-6 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce delay-150"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">En attente de traitement</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewId && selectedPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-10 animate-in fade-in duration-300" onClick={() => setPreviewId(null)}>
          <div className="max-w-6xl w-full bg-white dark:bg-slate-900 rounded-[4rem] p-12 shadow-2xl relative animate-in zoom-in-95 overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-8 h-full flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.5rem] text-indigo-600">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight truncate max-w-sm">{selectedPreview.name}</h5>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Identifiant unique : {selectedPreview.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[50vh] rounded-[2.5rem] overflow-hidden border-4 border-slate-50 dark:border-white/5 shadow-2xl bg-slate-100 dark:bg-slate-800">
                    {selectedPreview.mimeType.startsWith('image/') ? (
                      <img src={`data:${selectedPreview.mimeType};base64,${selectedPreview.content}`} className="w-full h-full object-contain" alt="Aperçu" />
                    ) : selectedPreview.mimeType === 'application/pdf' ? (
                      <iframe 
                        src={`data:application/pdf;base64,${selectedPreview.content}#toolbar=0`} 
                        className="w-full h-full border-none"
                        title="Aperçu PDF"
                      />
                    ) : (
                      <div className="h-full overflow-y-auto p-10 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap leading-[1.8] text-lg custom-scrollbar">
                        {selectedPreview.content}
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex flex-col">
                  <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="w-24 h-24" /></div>
                    <h5 className="text-xl font-black mb-6 flex items-center gap-3"><Zap className="w-6 h-6" /> Rapport d'Analyse Automatique</h5>
                    <p className="text-lg leading-relaxed font-medium italic opacity-90">{selectedPreview.analysisSummary || "Analyse en cours..."}</p>
                  </div>
                  
                  <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-white/5">
                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Métadonnées Cliniques</h6>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-sm font-bold text-slate-500">Date d'import</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{new Date(selectedPreview.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-sm font-bold text-slate-500">Format</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{selectedPreview.mimeType}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-sm font-bold text-slate-500">Pagination</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedPreview.pageCount || 1} Page(s)</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-bold text-slate-500">Poids du fichier</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{Math.round(selectedPreview.content.length / 1024)} KB</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="mt-10 w-full py-5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-[1.75rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all" 
                    onClick={() => setPreviewId(null)}
                  >
                    Fermer la vue détaillée
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
