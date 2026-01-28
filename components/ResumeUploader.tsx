
import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileJson, FileText, FileSpreadsheet, TrendingUp, Folder, Check, HelpCircle } from 'lucide-react';
import { parseResume } from '../services/geminiService';
import { Candidate, CandidateCategory, BusinessUnit, CandidateStatus, EmployeeType } from '../types';
import * as XLSX from 'xlsx';

interface ResumeUploaderProps {
  onCandidateAdded: (c: Candidate) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onCandidateAdded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [targetType, setTargetType] = useState<EmployeeType>('Proposed');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    try {
      for (const file of Array.from(files)) {
        setProgress(`Processing ${file.name}...`);
        
        // Handle CSV / Excel Sheet Import
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet) as any[];

          for (const row of rows) {
            const id = row.id || row.ID || Math.random().toString(36).substr(2, 9);
            const candidate: Candidate = {
              id,
              name: row.Name || row.name || 'Unknown',
              email: row.Email || row.email || '',
              phone: row.Phone || row.phone || '',
              location: row.Location || row.location || '',
              role: row.Role || row.role || 'Not Specified',
              category: (row.Category || row.category || row.Department || row.DEPARTMENT || 'Uncategorized') as CandidateCategory,
              businessUnit: (row['Business Unit'] || row.BusinessUnit || row.BU || row.unit || 'Avante Facade') as BusinessUnit,
              status: (row.Status || row.status || 'New') as CandidateStatus,
              employeeType: targetType, 
              skills: (row.Skills || row.skills || '').split(/[;,]+/).map((s: string) => s.trim()).filter(Boolean),
              education: row.Education || row.education || '',
              experience: row.Experience || row.experience || row.History || '',
              summary: row.Summary || row.summary || row['AI Summary'] || '',
              certifications: (row.Certifications || row.certifications || '').split(/[;,]+/).map((s: string) => s.trim()).filter(Boolean),
              fileReferenceId: row.fileReferenceId || `IMPORT_${Date.now()}`,
              createdAt: Date.now(),
              isEnriched: !!row.Enriched,
            };

            // Map Behavioral data if present
            if (row.Strengths || row.Weaknesses || row['Ownership Mentality']) {
              candidate.behavioralInsight = {
                attitude: { 
                  rating: (row['Ownership Mentality'] || 'Medium') as 'High' | 'Medium' | 'Low', 
                  summary: row.Attitude_Summary || 'Imported from record.' 
                },
                growth: { 
                  primaryMotivator: (row['Primary Motivator'] || 'Security' || 'Status' || 'Mastery') as 'Security' | 'Status' | 'Mastery', 
                  summary: row.Growth_Summary || 'Imported from record.' 
                },
                leadership: { 
                  intention: (row['Leadership Intent'] || 'Solo High-Performer') as 'Solo High-Performer' | 'People Leader', 
                  summary: row.Leadership_Summary || 'Imported from record.' 
                },
                swot: {
                  strengths: (row.Strengths || '').split(/[;]+/).map((s: string) => s.trim()).filter(Boolean),
                  weaknesses: (row.Weaknesses || '').split(/[;]+/).map((s: string) => s.trim()).filter(Boolean),
                  opportunities: (row.Opportunities || '').split(/[;]+/).map((s: string) => s.trim()).filter(Boolean),
                  threats: (row.Threats || '').split(/[;]+/).map((s: string) => s.trim()).filter(Boolean),
                },
                fullReport: row['Psychometric Report'] || row.fullReport || ''
              };
            }
            onCandidateAdded(candidate);
          }
          continue;
        }

        // Handle JSON Import
        if (file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          const updateType = (c: any) => ({ ...c, employeeType: targetType });
          if (Array.isArray(data)) data.forEach(c => onCandidateAdded(updateType(c)));
          else onCandidateAdded(updateType(data));
          continue;
        }

        // Handle Resume Parsing
        const text = await file.text();
        const dataUrl = await fileToDataUrl(file);
        const parsed = await parseResume(text);
        
        onCandidateAdded({
          id: Math.random().toString(36).substr(2, 9),
          ...parsed,
          employeeType: targetType, 
          status: 'New', isEnriched: false, fileName: file.name, fileSize: formatFileSize(file.size),
          fileType: file.type || 'application/pdf', fileDataUrl: dataUrl, createdAt: Date.now(),
        });
      }
      alert(`Upload complete. Records added to ${targetType} Repository.`);
    } catch (error) {
      console.error("Ingest Error:", error);
      alert("Ingest failed for some items. Ensure files are correctly formatted.");
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Repository Selection */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Select Target Repository</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Where should these CVs be stored?</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setTargetType('Proposed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              targetType === 'Proposed' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <TrendingUp size={14} /> Proposed
            {targetType === 'Proposed' && <Check size={12} />}
          </button>
          <button 
            onClick={() => setTargetType('Requirement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              targetType === 'Requirement' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HelpCircle size={14} /> Requirement
            {targetType === 'Requirement' && <Check size={12} />}
          </button>
          <button 
            onClick={() => setTargetType('Current')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              targetType === 'Current' ? 'bg-white text-green-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Folder size={14} /> Current
            {targetType === 'Current' && <Check size={12} />}
          </button>
        </div>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center min-h-[240px] ${
          isHovered ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-300 bg-white shadow-sm'
        } ${isProcessing ? 'opacity-70 pointer-events-none' : 'cursor-pointer hover:border-blue-400'}`}
        onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={(e) => { e.preventDefault(); setIsHovered(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" ref={fileInputRef} multiple className="hidden" 
          accept=".pdf,.docx,.txt,.json,.xlsx,.xls,.csv"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full animate-ping absolute opacity-20" />
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 relative">
                <Loader2 className="animate-spin" size={40} />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">Smart Gateway Active</h3>
              <p className="text-slate-500 text-sm font-medium">{progress}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100"><FileText size={28} /></div>
              <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-sm border border-green-100"><FileSpreadsheet size={28} /></div>
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm border border-orange-100"><FileJson size={28} /></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Unified Ingest Hub</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Drag and drop CVs or professional reports. AI maps records to your <span className={`font-bold ${targetType === 'Proposed' ? 'text-orange-500' : targetType === 'Requirement' ? 'text-purple-500' : 'text-green-500'}`}>{targetType} repository</span> instantly.
              </p>
            </div>
            <button 
              className={`mt-4 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95`}
            >
              <Upload size={18} /> SELECT FILES
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader;
