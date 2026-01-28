
import React, { useState, useRef } from 'react';
import { Position, CandidateCategory, BusinessUnit, PositionStatus, EmployeeType, Candidate, CandidateStatus } from '../types';
import { 
  Plus, Edit2, Trash2, Download, Upload, 
  FileSpreadsheet, Save, X, Target, 
  TrendingUp, Activity, CheckCircle2, Calendar, User, Filter, Search, Loader2, FileUp, ChevronDown, FilePlus, Building2, Layers, ClipboardList, HelpCircle, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseResume } from '../services/geminiService';

interface RecruitmentUpdateProps {
  positions: Position[];
  candidates: Candidate[];
  onUpdatePositions: (positions: Position[]) => void;
  onViewCandidate: (c: Candidate) => void;
  onAddCandidate: (c: Candidate) => void;
  onSyncCandidateType?: (name: string, type: EmployeeType) => void;
}

const CATEGORIES: CandidateCategory[] = [
  'Engineering', 'Design', 'Resource management', 'Project management', 
  'Facade management', 'BD & Marketing', 'Finance and Admin', 
  'Facade forensic', 'Tactile materials', 'Uncategorized'
];

const BUSINESS_UNITS: BusinessUnit[] = [
  'Avante Facade', 'Tactile Materials', 'Facade Forensics', 'Facade Recladding', 'Corporate'
];

const formatExcelDate = (val: any): string => {
  if (val === undefined || val === null || val === '') return '';
  const strVal = String(val).trim().replace(/\./g, '-');
  const potentialNum = Number(strVal);
  if (!isNaN(potentialNum) && potentialNum > 20000 && potentialNum < 100000) {
    const date = new Date(Math.round((potentialNum - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
    const [y, m, d] = strVal.split('-');
    return `${d}-${m}-${y}`;
  }
  return strVal;
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const RecruitmentUpdate: React.FC<RecruitmentUpdateProps> = ({ positions, candidates, onUpdatePositions, onViewCandidate, onAddCandidate, onSyncCandidateType }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterType, setFilterType] = useState<'All' | EmployeeType>('All');
  const [newPosition, setNewPosition] = useState<Partial<Position>>({
    candidateName: '', 
    category: 'Engineering', 
    businessUnit: 'Avante Facade',
    title: '', 
    requirement: '',
    targetJoiningDate: '', 
    interviewStatus: '', 
    actualJoiningDate: '', 
    status: 'Active',
    employeeType: 'Proposed'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvUploadRef = useRef<HTMLInputElement>(null);
  const toolbarUploadRef = useRef<HTMLInputElement>(null);
  const activePositionRef = useRef<{ name: string, type: EmployeeType } | null>(null);

  const handleAdd = () => {
    if (!newPosition.title) return;
    const position: Position = {
      id: Math.random().toString(36).substr(2, 9),
      candidateName: newPosition.candidateName || 'TBD',
      category: (newPosition.category as CandidateCategory) || 'Uncategorized',
      businessUnit: (newPosition.businessUnit as BusinessUnit) || 'Avante Facade',
      title: newPosition.title!,
      requirement: newPosition.requirement || 'N/A',
      targetJoiningDate: formatExcelDate(newPosition.targetJoiningDate) || '',
      interviewStatus: formatExcelDate(newPosition.interviewStatus) || 'N/A',
      actualJoiningDate: formatExcelDate(newPosition.actualJoiningDate) || '',
      status: (newPosition.candidateName && newPosition.actualJoiningDate) ? 'Filled' : (newPosition.status || 'Active' as PositionStatus),
      employeeType: newPosition.employeeType as EmployeeType,
      createdAt: Date.now()
    };
    onUpdatePositions([...positions, position]);
    setIsAdding(false);
    setNewPosition({ candidateName: '', category: 'Engineering', businessUnit: 'Avante Facade', title: '', requirement: '', targetJoiningDate: '', interviewStatus: '', actualJoiningDate: '', status: 'Active', employeeType: 'Proposed' });
  };

  const handleUpdate = (id: string, updates: Partial<Position>) => {
    onUpdatePositions(positions.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (updates.employeeType && p.candidateName && onSyncCandidateType) {
          onSyncCandidateType(p.candidateName, updates.employeeType);
        }
        return updated;
      }
      return p;
    }));
  };

  const cycleType = (id: string, currentType: EmployeeType) => {
    const types: EmployeeType[] = ['Proposed', 'Requirement', 'Current'];
    const currentIndex = types.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % types.length;
    handleUpdate(id, { employeeType: types[nextIndex] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this record?')) {
      onUpdatePositions(positions.filter(p => p.id !== id));
    }
  };

  const handleNameDoubleClick = (name: string, type: EmployeeType) => {
    const candidate = candidates.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (candidate) {
      onViewCandidate(candidate);
    } else {
      activePositionRef.current = { name, type };
      cvUploadRef.current?.click();
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const dataUrl = await fileToDataUrl(file);
      const parsed = await parseResume(text);
      
      const targetType = activePositionRef.current?.type || (filterType === 'All' ? 'Proposed' : filterType);
      const targetName = activePositionRef.current?.name || parsed.name || 'New Candidate';

      const newCandidate: Candidate = {
        id: Math.random().toString(36).substr(2, 9),
        ...parsed,
        name: targetName,
        employeeType: targetType as EmployeeType,
        status: 'New', 
        isEnriched: false, 
        fileName: file.name, 
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        fileType: file.type || 'application/pdf', 
        fileDataUrl: dataUrl, 
        createdAt: Date.now(),
      };
      
      onAddCandidate(newCandidate);
      alert(`CV successfully added to the ${targetType} repository.`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse CV. Please try again.");
    } finally {
      setIsUploading(false);
      activePositionRef.current = null;
      if (cvUploadRef.current) cvUploadRef.current.value = '';
      if (toolbarUploadRef.current) toolbarUploadRef.current.value = '';
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];
    const importedPositions: Position[] = rows.map(row => ({
      id: Math.random().toString(36).substr(2, 9),
      candidateName: row.NAME || row.Name || row.Candidate || 'TBD',
      category: (row.DEPARTMENT || row.Department || row.Category || 'Uncategorized') as CandidateCategory,
      businessUnit: (row['BUSINESS UNIT'] || row.BusinessUnit || 'Avante Facade') as BusinessUnit,
      title: row.DESIGNATION || row.Designation || row.Role || 'Untitled Position',
      requirement: row.REQUIREMENT || row.Requirement || 'N/A',
      targetJoiningDate: formatExcelDate(row['TARGET DATE'] || row['TARGET DATE OF JOINING'] || row.TargetDate || ''),
      interviewStatus: formatExcelDate(row['INTERVIEW STATUS'] || row.InterviewStatus || 'N/A'),
      actualJoiningDate: formatExcelDate(row['DATE OF JOINING'] || row.JoiningDate || ''),
      status: (row['DATE OF JOINING'] || row.Status === 'Filled') ? 'Filled' : 'Active',
      employeeType: (row.TYPE || row.EmployeeType || 'Proposed') as EmployeeType,
      createdAt: Date.now()
    }));
    onUpdatePositions([...positions, ...importedPositions]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    const filename = `workforce_planning_${new Date().toISOString().split('T')[0]}`;
    const dataToExport = filteredPositions.map(pos => ({
      'CANDIDATE NAME': pos.candidateName || 'TBD',
      'TYPE': pos.employeeType,
      'BUSINESS UNIT': pos.businessUnit,
      'DEPARTMENT': pos.category,
      'DESIGNATION': pos.title,
      'REQUIREMENT': pos.requirement,
      'TARGET DATE': pos.targetJoiningDate || '',
      'INTERVIEW STATUS': pos.interviewStatus || '',
      'DATE OF JOINING': pos.actualJoiningDate || '',
      'STATUS': pos.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workforce Planning");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const filteredPositions = filterType === 'All' 
    ? positions 
    : positions.filter(p => p.employeeType === filterType);

  const totalPositions = positions.length;
  const currentCount = positions.filter(p => p.employeeType === 'Current').length;
  const proposedCount = positions.filter(p => p.employeeType === 'Proposed').length;
  const requirementCount = positions.filter(p => p.employeeType === 'Requirement').length;

  const getTypeStyle = (type: EmployeeType) => {
    switch (type) {
      case 'Current': return 'bg-green-50 text-green-700 border-green-200';
      case 'Proposed': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Requirement': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCandidateStatusStyle = (status: CandidateStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Screening': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Interview': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Hired': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <input type="file" ref={cvUploadRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleCVUpload} />
      <input type="file" ref={toolbarUploadRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleCVUpload} />
      
      {isUploading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-800">AI Document Processing</h3>
              <p className="text-xs text-slate-500">Mapping credentials to workforce planning...</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Target size={20} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Capacity</p>
            <h3 className="text-xl font-black text-slate-800">{totalPositions}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Workforce</p>
            <h3 className="text-xl font-black text-slate-800">{currentCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In Pipeline</p>
            <h3 className="text-xl font-black text-slate-800">{proposedCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><HelpCircle size={20} /></div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requirements</p>
            <h3 className="text-xl font-black text-slate-800">{requirementCount}</h3>
          </div>
        </div>
      </div>

      {/* Add Position Modal-ish section */}
      {isAdding && (
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 animate-in slide-in-from-top-4">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest">Add New Workforce Position</h3>
              <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-white rounded-full"><X size={18} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <input 
                placeholder="Candidate (or TBD)" 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={newPosition.candidateName} onChange={e => setNewPosition({...newPosition, candidateName: e.target.value})}
              />
              <select 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                value={newPosition.employeeType} onChange={e => setNewPosition({...newPosition, employeeType: e.target.value as EmployeeType})}
              >
                <option value="Proposed">Proposed</option>
                <option value="Requirement">Requirement</option>
                <option value="Current">Current</option>
              </select>
              <input 
                placeholder="Designation" 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={newPosition.title} onChange={e => setNewPosition({...newPosition, title: e.target.value})}
              />
              <input 
                placeholder="Justification" 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={newPosition.requirement} onChange={e => setNewPosition({...newPosition, requirement: e.target.value})}
              />
              <select 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                value={newPosition.businessUnit} onChange={e => setNewPosition({...newPosition, businessUnit: e.target.value as BusinessUnit})}
              >
                {BUSINESS_UNITS.map(bu => <option key={bu} value={bu}>{bu}</option>)}
              </select>
              <select 
                className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none"
                value={newPosition.category} onChange={e => setNewPosition({...newPosition, category: e.target.value as CandidateCategory})}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
           </div>
           <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg">CONFIRM ADDITION</button>
           </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Activity size={24} className="text-blue-600" />
            Workforce Planning
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Roadmap • {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['All', 'Current', 'Proposed', 'Requirement'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${filterType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200">
            <FileSpreadsheet size={16} /> Export
          </button>
          <button onClick={() => toolbarUploadRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all shadow-sm">
            <FilePlus size={16} className="text-blue-500" /> Upload CV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all">
            <Plus size={16} /> Add Position
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Candidate Name</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Interview Status</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Business Unit</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Designation</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Requirement</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Date</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPositions.map(pos => {
                const linkedCandidate = candidates.find(c => c.name.toLowerCase() === pos.candidateName?.toLowerCase());
                const hasCV = !!linkedCandidate;
                
                return (
                  <tr key={pos.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/name relative" 
                        onDoubleClick={() => handleNameDoubleClick(pos.candidateName || '', pos.employeeType)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasCV ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                          {hasCV ? <User size={14} /> : <FileUp size={14} />}
                        </div>
                        <div>
                          <span className={`text-sm font-bold block text-slate-800`}>
                            {pos.candidateName || 'TBD'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      {linkedCandidate ? (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getCandidateStatusStyle(linkedCandidate.status)}`}>
                          {linkedCandidate.status}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock size={10} />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <button 
                        onClick={() => cycleType(pos.id, pos.employeeType)}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-all ${getTypeStyle(pos.employeeType)}`}
                      >
                        {pos.employeeType}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative group/sel">
                        <select 
                          value={pos.businessUnit}
                          onChange={(e) => handleUpdate(pos.id, { businessUnit: e.target.value as BusinessUnit })}
                          className="bg-transparent border-none text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4 hover:text-blue-600 transition-colors"
                        >
                          {BUSINESS_UNITS.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                        </select>
                        <Building2 size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover/sel:text-blue-400" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative group/sel">
                        <select 
                          value={pos.category}
                          onChange={(e) => handleUpdate(pos.id, { category: e.target.value as CandidateCategory })}
                          className="bg-transparent border-none text-[10px] font-bold text-blue-600 uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4 hover:text-blue-800 transition-colors"
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <Layers size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover/sel:text-blue-400" />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700">{pos.title}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group/req">
                        <ClipboardList size={12} className="text-slate-300 group-hover/req:text-blue-400" />
                        <span className="text-xs text-slate-600 font-medium italic">{pos.requirement || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-xs font-mono text-slate-500">{pos.targetJoiningDate || '---'}</td>
                    <td className="px-4 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(pos.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentUpdate;
