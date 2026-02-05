
import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { HealthDocument } from '../types';
import { fileToBase64, anonymizeText } from '../utils/anonymizer';

interface DocumentManagerProps {
  documents: HealthDocument[];
  setDocuments: (docs: HealthDocument[]) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newDocs: HealthDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      
      // Basic Anonymization if it's a text file (simplified)
      let content = base64;
      if (file.type === 'text/plain') {
         const reader = new FileReader();
         const text = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
         });
         content = anonymizeText(text);
      }

      newDocs.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        content: content,
        mimeType: file.type,
        timestamp: Date.now(),
        anonymized: true
      });
    }

    setDocuments([...newDocs, ...documents]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDoc = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Upload Section */}
      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors flex flex-col items-center justify-center gap-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*, .pdf, .txt" 
          onChange={handleFileUpload} 
        />
        <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform">
          {isUploading ? <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /> : <Upload className="w-8 h-8 text-emerald-500" />}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800">Cliquez pour ajouter des documents</h3>
          <p className="text-slate-500 text-sm mt-1">Images, PDFs ou fichiers texte de santé (Max 10MB)</p>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Anonymisation Auto
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
             <Search className="w-3 h-3 text-blue-500" /> OCR par Gemini
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-xl ${doc.type.includes('image') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeDoc(doc.id); }}
                className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-semibold text-slate-800 truncate mb-1" title={doc.name}>{doc.name}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              {new Date(doc.timestamp).toLocaleDateString()} • {Math.round(doc.content.length / 1024)} KB
            </p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Prêt pour analyse</span>
            </div>
          </div>
        ))}
        {documents.length === 0 && !isUploading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p>Aucun document téléchargé.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
