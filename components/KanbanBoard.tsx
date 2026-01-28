
import React from 'react';
import { Candidate, CandidateStatus } from '../types';
import { User, Briefcase, MapPin, Search, ChevronRight, MoreVertical, Calendar } from 'lucide-react';

interface KanbanBoardProps {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
  onUpdateStatus: (id: string, status: CandidateStatus) => void;
}

const COLUMNS: CandidateStatus[] = ['New', 'Screening', 'Interview', 'Hired', 'Rejected'];

const COLUMN_COLORS: Record<CandidateStatus, { bg: string; text: string; dot: string }> = {
  'New': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Screening': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Interview': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Hired': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Rejected': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, onSelect, onUpdateStatus }) => {
  const getCandidatesByStatus = (status: CandidateStatus) => 
    candidates.filter(c => c.status === status);

  const handleQuickMove = (e: React.ChangeEvent<HTMLSelectElement>, candidateId: string) => {
    e.stopPropagation();
    onUpdateStatus(candidateId, e.target.value as CandidateStatus);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-6 min-w-max lg:min-w-0">
      {COLUMNS.map(column => (
        <div key={column} className="flex flex-col gap-4 min-w-[280px]">
          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 shadow-sm ${COLUMN_COLORS[column].bg}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${COLUMN_COLORS[column].dot}`} />
              <h3 className={`font-bold uppercase text-[10px] tracking-[0.15em] ${COLUMN_COLORS[column].text}`}>{column}</h3>
            </div>
            <span className="bg-white/50 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-black border border-white/20">
              {getCandidatesByStatus(column).length}
            </span>
          </div>
          
          <div className="kanban-column bg-slate-100/40 rounded-2xl p-3 border border-slate-200/60 flex flex-col gap-3">
            {getCandidatesByStatus(column).map(candidate => (
              <div 
                key={candidate.id}
                onClick={() => onSelect(candidate)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all group relative animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs truncate max-w-[140px]">{candidate.name || 'Untitled'}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[140px] mt-0.5">{candidate.role || 'No Role'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {candidate.isEnriched && (
                      <div className="bg-blue-50 text-blue-600 p-1 rounded-lg border border-blue-100" title="AI Enriched">
                        <Search size={12} />
                      </div>
                    )}
                    {(candidate.interviews?.length || 0) > 0 && (
                      <div className="bg-purple-50 text-purple-600 p-1 rounded-lg border border-purple-100" title={`${candidate.interviews?.length} Interviews Scheduled`}>
                        <Calendar size={12} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                    <MapPin size={10} className="text-slate-400" />
                    <span className="truncate">{candidate.location || 'Remote / Unspecified'}</span>
                  </div>
                  {(candidate.interviews?.length || 0) > 0 && (
                    <div className="flex items-center gap-2 text-purple-600 text-[9px] font-black uppercase tracking-widest">
                      <Calendar size={10} />
                      <span>{candidate.interviews?.length} Scheduled</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {candidate.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-lg border border-slate-100">
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-bold self-center">+{candidate.skills.length - 3} more</span>
                  )}
                </div>
                
                <div className="mt-5 flex justify-between items-center pt-3 border-t border-slate-50">
                   <button className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1 hover:underline group-hover:gap-2 transition-all">
                     VIEW <ChevronRight size={10} />
                   </button>
                   
                   {/* Quick Move Selector */}
                   <div className="relative" onClick={e => e.stopPropagation()}>
                     <select 
                      value={candidate.status}
                      onChange={e => handleQuickMove(e, candidate.id)}
                      className="appearance-none bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2 pr-6 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors outline-none border border-slate-200"
                     >
                       {COLUMNS.map(s => (
                         <option key={s} value={s}>{s}</option>
                       ))}
                     </select>
                     <ChevronRight size={8} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                   </div>
                </div>
              </div>
            ))}
            
            {getCandidatesByStatus(column).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-white/30">
                <p className="text-[10px] font-bold uppercase tracking-widest">Empty</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
