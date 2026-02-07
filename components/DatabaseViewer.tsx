
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Calendar, Award, Tag } from 'lucide-react';
import { MedicalStudy } from '../types';

interface DatabaseViewerProps {
  specialty: string;
}

const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ specialty }) => {
  const [studies, setStudies] = useState<MedicalStudy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState(specialty);

  useEffect(() => {
    fetch('/data/medical_database.json')
      .then(res => res.json())
      .then(data => setStudies(data))
      .catch(err => console.error("Erreur base de données:", err));
  }, []);

  const specialties = Array.from(new Set(studies.map(s => s.specialite)));
  
  const filteredStudies = studies.filter(s => {
    const matchesSearch = s.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.contenu_texte.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = filterSpecialty === "Toutes" ? true : s.specialite === filterSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Base Scientifique Pro</h3>
          <p className="text-slate-500">Consultation des études servant de référence au Co-pilote IA.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une étude..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              value={filterSpecialty}
              onChange={e => setFilterSpecialty(e.target.value)}
            >
              <option value="Toutes">Toutes les spécialités</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudies.map((study) => (
          <div key={study.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  study.niveau_preuve === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                  study.niveau_preuve === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  Niveau {study.niveau_preuve}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-full">
                  <Tag className="w-3 h-3" /> {study.specialite}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(study.date_publication).toLocaleDateString()}
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-800 mb-3 leading-snug">{study.titre}</h4>
            
            <div className="bg-slate-50/50 p-4 rounded-2xl text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
              {study.contenu_texte}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${study.niveau_preuve === 'A' ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Source : {study.id}</span>
              </div>
              <button className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
                Détails complets
              </button>
            </div>
          </div>
        ))}
        {filteredStudies.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300">
            <BookOpen className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium">Aucune étude ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseViewer;
