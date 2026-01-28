
import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus, CandidateCategory, BusinessUnit, Position, EmployeeType } from './types';
import KanbanBoard from './components/KanbanBoard';
import ResumeUploader from './components/ResumeUploader';
import CandidateProfile from './components/CandidateProfile';
import DocumentLibrary from './components/DocumentLibrary';
import DocumentViewer from './components/DocumentViewer';
import RecruitmentUpdate from './components/RecruitmentUpdate';
import FlashReport from './components/FlashReport';
import WorkforceGapAnalysis from './components/WorkforceGapAnalysis';
import { LayoutDashboard, Users, Settings, Plus, LayoutGrid, List, Search as SearchIcon, CheckCircle, Folder, UserPlus, Download, Upload, FileSpreadsheet, FileJson, FileText, Target, Activity, Zap, BarChart3, Building2, HelpCircle, ChevronDown, Map, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUSES: CandidateStatus[] = ['New', 'Screening', 'Interview', 'Hired', 'Rejected'];

const App: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('recruittrack_candidates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('recruittrack_positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [manualRequirements, setManualRequirements] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('recruittrack_manual_reqs');
    return saved ? JSON.parse(saved) : {
      'Design': 0,
      'Engineering': 0,
      'project management': 0,
      'Resource management': 0,
      'Finance and Admin': 0,
      'BD & Marketing': 0
    };
  });

  const [view, setView] = useState<'kanban' | 'list' | 'ingest' | 'documents' | 'recruitment_update' | 'flash_report' | 'gap_analysis'>('kanban');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('recruittrack_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('recruittrack_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('recruittrack_manual_reqs', JSON.stringify(manualRequirements));
  }, [manualRequirements]);

  const addCandidate = (c: Candidate) => {
    setCandidates(prev => {
      const exists = prev.some(existing => existing.id === c.id || (c.email && existing.email === c.email));
      if (exists) return prev.map(existing => (existing.id === c.id || (c.email && existing.email === c.email)) ? { ...existing, ...c } : existing);
      return [c, ...prev];
    });
  };

  const updateCandidate = (updated: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCandidate?.id === updated.id) setSelectedCandidate(updated);
  };

  const deleteCandidate = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this candidate profile and its associated document? This action cannot be undone.')) {
      setCandidates(prev => prev.filter(c => c.id !== id));
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
      if (viewingDocument?.id === id) setViewingDocument(null);
    }
  };

  const syncCandidateTypeByName = (name: string, type: EmployeeType) => {
    setCandidates(prev => prev.map(c => 
      c.name.toLowerCase() === name.toLowerCase() 
        ? { ...c, employeeType: type } 
        : c
    ));
  };

  const handleExport = (format: 'json' | 'csv' | 'xlsx') => {
    const filename = `recruittrack_export_${new Date().toISOString().split('T')[0]}`;
    if (format === 'json') {
      const dataStr = JSON.stringify({ candidates, positions }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `${filename}.json`);
      linkElement.click();
    } else {
      const ws = XLSX.utils.json_to_sheet(candidates);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Candidates");
      XLSX.writeFile(wb, `${filename}.${format}`);
    }
    setIsExportMenuOpen(false);
  };

  const handleManualAdd = () => {
    const newCandidate: Candidate = {
      id: Math.random().toString(36).substr(2, 9),
      name: '', email: '', phone: '', location: '', skills: [], education: '', experience: '', summary: '', role: '',
      status: 'New', category: 'Uncategorized', businessUnit: 'Avante Facade', certifications: [],
      fileReferenceId: `MANUAL_${Date.now()}`, createdAt: Date.now(), isEnriched: false,
    };
    setSelectedCandidate(newCandidate);
  };

  const getTitle = () => {
    switch (view) {
      case 'kanban': return 'Recruitment Pipeline';
      case 'list': return 'Candidate Directory';
      case 'ingest': return 'Smart Ingest Gateway';
      case 'documents': return 'CV Repository';
      case 'recruitment_update': return 'Workforce Planning';
      case 'flash_report': return 'AI Flash Report';
      case 'gap_analysis': return 'Resource Roadmap & Analysis';
      default: return 'RecruitTrack';
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getBadgeStyle = (type: EmployeeType) => {
    switch (type) {
      case 'Current': return 'bg-green-100 text-green-700';
      case 'Requirement': return 'bg-purple-100 text-purple-700';
      case 'Proposed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadgeStyle = (status: CandidateStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Screening': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Interview': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Hired': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">RT</div>
          <span className="text-white font-bold text-xl tracking-tight">RecruitTrack</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-2">Recruitment</h4>
          <button onClick={() => setView('kanban')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'kanban' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> <span className="font-semibold text-sm">Pipeline</span>
          </button>
          <button onClick={() => setView('ingest')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'ingest' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Plus size={20} /> <span className="font-semibold text-sm">Smart Ingest</span>
          </button>
          <button onClick={() => setView('documents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'documents' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Folder size={20} /> <span className="font-semibold text-sm">CV Repository</span>
          </button>

          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 mt-6 px-2">Analytics & Management</h4>
          <button onClick={() => setView('flash_report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'flash_report' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Zap size={20} /> <span className="font-semibold text-sm">Flash Report</span>
          </button>
          <button onClick={() => setView('gap_analysis')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'gap_analysis' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Map size={20} /> <span className="font-semibold text-sm">Resource Roadmap</span>
          </button>
          <button onClick={() => setView('recruitment_update')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'recruitment_update' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Target size={20} /> <span className="font-semibold text-sm">Workforce Planning</span>
          </button>

          <div className="pt-6 mt-6 border-t border-slate-800 px-2 space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-2">Data Operations</h4>
            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors">
              <div className="flex items-center gap-3"><Download size={16} /> Export Data</div>
              <div className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}>▼</div>
            </button>
            {isExportMenuOpen && (
              <div className="mt-1 ml-4 space-y-1">
                <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-[10px] font-bold text-slate-400"><FileSpreadsheet size={14} className="text-green-500" /> EXCEL</button>
                <button onClick={() => handleExport('json')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-[10px] font-bold text-slate-400"><FileJson size={14} className="text-orange-400" /> JSON</button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 bg-slate-800/50 m-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{candidates.length} Profiles Tracked.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-slate-800">{getTitle()}</h1>
            {view !== 'recruitment_update' && view !== 'flash_report' && view !== 'gap_analysis' && (
              <div className="relative group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  type="text" placeholder="Search records..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-sm w-80 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {view !== 'recruitment_update' && view !== 'flash_report' && view !== 'gap_analysis' && (
              <>
                <button onClick={handleManualAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all">
                  <UserPlus size={18} /> Manual Add
                </button>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md ${view === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
                  <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><List size={18} /></button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {view === 'flash_report' ? (
            <FlashReport candidates={candidates} positions={positions} />
          ) : view === 'gap_analysis' ? (
            <WorkforceGapAnalysis 
              candidates={candidates} 
              positions={positions} 
              manualRequirements={manualRequirements} 
              setManualRequirements={setManualRequirements} 
            />
          ) : view === 'recruitment_update' ? (
            <RecruitmentUpdate 
              positions={positions}
              candidates={candidates}
              onUpdatePositions={setPositions}
              onViewCandidate={(c) => setSelectedCandidate(c)}
              onAddCandidate={addCandidate}
              onSyncCandidateType={syncCandidateTypeByName}
            />
          ) : view === 'ingest' ? (
            <div className="flex flex-col h-full bg-slate-50/50">
              <div className="p-8 border-b border-slate-200 bg-white">
                <ResumeUploader onCandidateAdded={addCandidate} />
              </div>
              <div className="flex-1">
                <DocumentLibrary 
                  candidates={filteredCandidates} 
                  onSelectCandidate={setSelectedCandidate} 
                  onViewDocument={setViewingDocument} 
                  onMoveToType={(id, type) => updateCandidate({...candidates.find(c => c.id === id)!, employeeType: type})}
                  onDeleteCandidate={deleteCandidate}
                  onAddCandidate={addCandidate}
                />
              </div>
            </div>
          ) : view === 'list' ? (
            <div className="p-8">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Candidate</th>
                       <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Interview Stage</th>
                       <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Folder</th>
                       <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">BU / Dept</th>
                       <th className="px-6 py-4"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredCandidates.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors group/row" onClick={() => setSelectedCandidate(c)}>
                         <td className="px-6 py-4">
                           <div className="font-semibold text-slate-800 text-sm">{c.name || 'Untitled Entry'}</div>
                           <div className="text-[10px] text-slate-500 font-medium">{c.email}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="relative inline-block group/status" onClick={e => e.stopPropagation()}>
                              <select 
                                value={c.status}
                                onChange={(e) => updateCandidate({...c, status: e.target.value as CandidateStatus})}
                                className={`appearance-none pl-3 pr-8 py-1 rounded text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer transition-all ${getStatusBadgeStyle(c.status)}`}
                              >
                                {STATUSES.map(stat => (
                                  <option key={stat} value={stat} className="bg-white text-slate-800 font-bold">{stat}</option>
                                ))}
                              </select>
                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getBadgeStyle(c.employeeType || 'Proposed')}`}>
                              {c.employeeType || 'Proposed'}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                               <Building2 size={10} className="text-slate-400" />
                               {c.businessUnit || 'N/A'}
                            </div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">{c.category}</div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteCandidate(c.id); }}
                               className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                               title="Delete Profile"
                             >
                               <Trash2 size={16} />
                             </button>
                             <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                               PROFILE
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : view === 'documents' ? (
            <DocumentLibrary 
              candidates={filteredCandidates} 
              onSelectCandidate={setSelectedCandidate} 
              onViewDocument={setViewingDocument} 
              onMoveToType={(id, type) => updateCandidate({...candidates.find(c => c.id === id)!, employeeType: type})}
              onDeleteCandidate={deleteCandidate}
              onAddCandidate={addCandidate}
            />
          ) : (
            <KanbanBoard 
              candidates={filteredCandidates} onSelect={setSelectedCandidate}
              onUpdateStatus={(id, status) => updateCandidate({...candidates.find(c => c.id === id)!, status})}
            />
          )}
        </div>
      </main>

      {selectedCandidate && <CandidateProfile candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onUpdate={updateCandidate} onDelete={deleteCandidate} />}
      {viewingDocument && <DocumentViewer candidate={viewingDocument} onClose={() => setViewingDocument(null)} />}
    </div>
  );
};

export default App;
