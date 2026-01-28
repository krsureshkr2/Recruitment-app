
import React, { useState, useRef } from 'react';
import { Candidate, EmployeeType, CandidateCategory } from '../types';
import { 
  FileText, Download, Eye, Calendar, User, Hash, 
  ChevronDown, Folder, Briefcase, TrendingUp, Search, 
  Plus, Upload, X, Loader2, CheckCircle2, HelpCircle, Trash2
} from 'lucide-react';
import { parseResume } from '../services/geminiService';

interface DocumentLibraryProps {
  candidates: Candidate[];
  onSelectCandidate: (c: Candidate) => void;
  onViewDocument: (c: Candidate) => void;
  onMoveToType: (candidateId: string, newType: EmployeeType) => void;
  onDeleteCandidate: (id: string) => void;
  onAddCandidate?: (c: Candidate) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ candidates, onSelectCandidate, onViewDocument, onMoveToType, onDeleteCandidate, onAddCandidate }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Current', 'Proposed', 'Requirement']));
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [targetType, setTargetType] = useState<EmployeeType>('Proposed');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (folder: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folder)) newSet.delete(folder);
    else newSet.add(folder);
    setExpandedFolders(newSet);
  };

  const getCandidatesByType = (type: EmployeeType) => 
    candidates.filter(c => (c.employeeType === type || (!c.employeeType && type === 'Proposed')) && c.fileName);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddCandidate) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const dataUrl = await fileToDataUrl(file);
      const parsed = await parseResume(text);
      
      const newCandidate: Candidate = {
        id: Math.random().toString(36).substr(2, 9),
        ...parsed,
        employeeType: targetType,
        status: 'New', 
        isEnriched: false, 
        fileName: file.name, 
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        fileType: file.type || 'application/pdf', 
        fileDataUrl: dataUrl, 
        createdAt: Date.now(),
      };
      
      onAddCandidate(newCandidate);
      setShowUploadModal(false);
      alert(`CV successfully added to ${targetType} Repository.`);
    } catch (err) {
      console.error(err);
      alert("Failed to parse and upload CV.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      {/* Upload Selection Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Upload to Repository</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Target Folder</label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setTargetType('Proposed')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      targetType === 'Proposed' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <TrendingUp size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Proposed</span>
                  </button>
                  <button 
                    onClick={() => setTargetType('Requirement')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      targetType === 'Requirement' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <HelpCircle size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Requirement</span>
                  </button>
                  <button 
                    onClick={() => setTargetType('Current')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      targetType === 'Current' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <Folder size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Current</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  {isProcessing ? 'ANALYZING DOCUMENT...' : 'SELECT FILE & UPLOAD'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">CV Repository</h2>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={14} className="text-blue-500" /> Managed Professional Archive
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="px-5 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total indexed Files</span>
              <span className="text-xl font-black text-blue-600">{candidates.filter(c => c.fileName).length}</span>
           </div>
           <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
           >
             <Plus size={20} />
             UPLOAD CV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* CURRENT Folder */}
        <section className="space-y-4">
          <button 
            onClick={() => toggleFolder('Current')}
            className="flex items-center gap-4 group w-full text-left"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              expandedFolders.has('Current') ? 'bg-green-600 text-white scale-110' : 'bg-green-50 text-green-600'
            }`}>
              <Folder size={28} />
            </div>
            <div className="flex-1 border-b-2 border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Workforce (Current)</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents for existing personnel</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black">{getCandidatesByType('Current').length} Files</span>
                <ChevronDown className={`transition-transform duration-300 ${expandedFolders.has('Current') ? 'rotate-0' : '-rotate-90'}`} />
              </div>
            </div>
          </button>

          {expandedFolders.has('Current') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {getCandidatesByType('Current').length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Folder is empty</p>
                </div>
              ) : (
                getCandidatesByType('Current').map(candidate => (
                  <DocumentCard key={candidate.id} candidate={candidate} onSelect={onSelectCandidate} onView={onViewDocument} onDelete={onDeleteCandidate} />
                ))
              )}
            </div>
          )}
        </section>

        {/* REQUIREMENT Folder */}
        <section className="space-y-4">
          <button 
            onClick={() => toggleFolder('Requirement')}
            className="flex items-center gap-4 group w-full text-left"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              expandedFolders.has('Requirement') ? 'bg-purple-600 text-white scale-110' : 'bg-purple-50 text-purple-600'
            }`}>
              <HelpCircle size={28} />
            </div>
            <div className="flex-1 border-b-2 border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Resource Requirements</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specific needs or justifications</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-black">{getCandidatesByType('Requirement').length} Files</span>
                <ChevronDown className={`transition-transform duration-300 ${expandedFolders.has('Requirement') ? 'rotate-0' : '-rotate-90'}`} />
              </div>
            </div>
          </button>

          {expandedFolders.has('Requirement') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {getCandidatesByType('Requirement').length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No requirement documents</p>
                </div>
              ) : (
                getCandidatesByType('Requirement').map(candidate => (
                  <DocumentCard key={candidate.id} candidate={candidate} onSelect={onSelectCandidate} onView={onViewDocument} onDelete={onDeleteCandidate} />
                ))
              )}
            </div>
          )}
        </section>

        {/* PROPOSED Folder */}
        <section className="space-y-4">
          <button 
            onClick={() => toggleFolder('Proposed')}
            className="flex items-center gap-4 group w-full text-left"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              expandedFolders.has('Proposed') ? 'bg-orange-500 text-white scale-110' : 'bg-orange-50 text-orange-600'
            }`}>
              <TrendingUp size={28} />
            </div>
            <div className="flex-1 border-b-2 border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recruitment Pipeline (Proposed)</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Draft roles and candidate submissions</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-black">{getCandidatesByType('Proposed').length} Files</span>
                <ChevronDown className={`transition-transform duration-300 ${expandedFolders.has('Proposed') ? 'rotate-0' : '-rotate-90'}`} />
              </div>
            </div>
          </button>

          {expandedFolders.has('Proposed') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {getCandidatesByType('Proposed').length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pending CVs in pipeline</p>
                </div>
              ) : (
                getCandidatesByType('Proposed').map(candidate => (
                  <DocumentCard key={candidate.id} candidate={candidate} onSelect={onSelectCandidate} onView={onViewDocument} onDelete={onDeleteCandidate} />
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const DocumentCard: React.FC<{ candidate: Candidate, onSelect: (c: Candidate) => void, onView: (c: Candidate) => void, onDelete: (id: string) => void }> = ({ candidate, onSelect, onView, onDelete }) => (
  <div 
    onClick={() => onSelect(candidate)}
    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group overflow-hidden flex flex-col h-full relative cursor-pointer"
  >
    {/* High-Visibility Floating Delete Button (Top Right) */}
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(candidate.id); }}
      className="absolute top-3 right-3 p-2 bg-slate-100/80 backdrop-blur-sm text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10 border border-slate-200 hover:border-red-200 shadow-sm active:scale-90"
      title="Delete Candidate Record"
    >
      <Trash2 size={14} />
    </button>

    <div className="p-5 flex-1">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <FileText size={20} />
        </div>
        <div className="text-right">
          <span className="block text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Category</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
            {candidate.category}
          </span>
        </div>
      </div>
      
      <h4 className="font-bold text-slate-800 text-sm mb-1 truncate" title={candidate.fileName}>{candidate.fileName}</h4>
      <div className="flex items-center gap-1 text-blue-600 font-mono text-[9px] font-black mb-4">
        <Hash size={10} /> {candidate.fileReferenceId}
      </div>
      
      <div className="space-y-2 mt-auto">
        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
          <User size={10} className="text-blue-400" />
          <span className="font-bold truncate">{candidate.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[9px] font-medium">
          <Calendar size={10} />
          {new Date(candidate.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
    
    <div className="bg-slate-50 p-2 flex border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect(candidate); }}
        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest py-1.5 rounded-lg hover:bg-blue-50 transition-all"
      >
        <Eye size={12} /> PROFILE
      </button>
      <div className="w-px h-4 bg-slate-200 self-center mx-1" />
      <button 
        onClick={(e) => { e.stopPropagation(); onView(candidate); }}
        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-black text-slate-600 hover:text-slate-800 uppercase tracking-widest py-1.5 rounded-lg hover:bg-slate-100 transition-all"
      >
        <FileText size={12} /> VIEW
      </button>
    </div>
  </div>
);

export default DocumentLibrary;
