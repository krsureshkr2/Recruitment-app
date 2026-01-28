
import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus, CandidateCategory, BusinessUnit, BehavioralInsight, EmployeeType, Interview } from '../types';
import { 
  X, Mail, Phone, MapPin, RefreshCw, 
  Linkedin, FileText, CheckCircle, Clock, 
  Search, ExternalLink as LinkIcon, Award, Hash, MessageSquare, Sparkles, Folder, Edit2, Save, RotateCcw, Brain, Shield, Zap, Target, AlertTriangle, Download,
  Loader2, ChevronDown, FileDown, Printer, TrendingUp, Layers, Building2, HelpCircle, Calendar, Plus, Trash2, User, Send, Smartphone, PartyPopper, UserX, FileX
} from 'lucide-react';
import { enrichCandidate, analyzeBehavioralInsight } from '../services/geminiService';
import AIClarityAssistant from './AIClarityAssistant';

interface CandidateProfileProps {
  candidate: Candidate;
  onClose: () => void;
  onUpdate: (c: Candidate) => void;
  onDelete?: (id: string) => void;
}

const CATEGORIES: CandidateCategory[] = [
  'Engineering', 'Design', 'Resource management', 'Project management', 
  'Facade management', 'BD & Marketing', 'Finance and Admin', 
  'Facade forensic', 'Tactile materials', 'Uncategorized'
];

const BUSINESS_UNITS: BusinessUnit[] = [
  'Avante Facade', 'Tactile Materials', 'Facade Forensics', 'Facade Recladding', 'Corporate'
];

const STATUSES: CandidateStatus[] = ['New', 'Screening', 'Interview', 'Hired', 'Rejected'];
const REPOSITORIES: EmployeeType[] = ['Proposed', 'Requirement', 'Current'];

const CandidateProfile: React.FC<CandidateProfileProps> = ({ candidate, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'psychometric' | 'web'>('details');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClarityAssistantOpen, setIsClarityAssistantOpen] = useState(false);
  const [formData, setFormData] = useState<Candidate>({ ...candidate });
  
  // Local state for adding a new interview
  const [newInterviewDate, setNewInterviewDate] = useState('');
  const [newInterviewer, setNewInterviewer] = useState('');
  const [newInterviewerPhone, setNewInterviewerPhone] = useState('');
  const [newInterviewerEmail, setNewInterviewerEmail] = useState('');

  useEffect(() => {
    setFormData({ ...candidate });
  }, [candidate]);

  const handleAddInterview = () => {
    if (!newInterviewDate || !newInterviewer) {
      alert("Please fill in both interview date and interviewer name.");
      return;
    }
    
    const newInterview: Interview = {
      id: Math.random().toString(36).substr(2, 9),
      date: newInterviewDate,
      interviewer: newInterviewer,
      interviewerPhone: newInterviewerPhone,
      interviewerEmail: newInterviewerEmail
    };

    const updatedInterviews = [...(formData.interviews || []), newInterview];
    const updated = { ...formData, interviews: updatedInterviews };
    setFormData(updated);
    onUpdate(updated);
    
    setNewInterviewDate('');
    setNewInterviewer('');
    setNewInterviewerPhone('');
    setNewInterviewerEmail('');
  };

  const handleRemoveInterview = (id: string) => {
    const updatedInterviews = (formData.interviews || []).filter(i => i.id !== id);
    const updated = { ...formData, interviews: updatedInterviews };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleNotifyWhatsApp = (it: Interview) => {
    if (!it.interviewerPhone) {
      alert("No phone number provided for this interviewer.");
      return;
    }
    const cleanPhone = it.interviewerPhone.replace(/\D/g, '');
    const message = `Hello ${it.interviewer},\n\nYou have an interview scheduled with ${candidate.name} for the position of ${candidate.role}.\n\n📅 Date: ${new Date(it.date).toLocaleString()}\n🎯 Skills: ${candidate.skills.slice(0, 5).join(', ')}\n\nProfile Summary: ${candidate.summary.slice(0, 150)}...`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleNotifyEmail = (it: Interview) => {
    if (!it.interviewerEmail) {
      alert("No email provided for this interviewer.");
      return;
    }
    const subject = `Interview Scheduled: ${candidate.name} for ${candidate.role}`;
    const body = `Hello ${it.interviewer},\n\nAn interview has been scheduled for the following candidate:\n\nCandidate: ${candidate.name}\nRole: ${candidate.role}\nDepartment: ${candidate.category}\nDate: ${new Date(it.date).toLocaleString()}\n\nSkills:\n${candidate.skills.join(', ')}\n\nSummary:\n${candidate.summary}\n\nPlease prepare accordingly.`;
    const mailto = `mailto:${it.interviewerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleExportCandidate = () => {
    const dataStr = JSON.stringify(candidate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `candidate_${candidate.name.replace(/\s+/g, '_')}_data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDownloadDossier = () => {
    const originalTitle = document.title;
    document.title = `Candidate_Dossier_${candidate.name.replace(/\s+/g, '_')}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handleStatusChange = (newStatus: CandidateStatus) => {
    const updated = { ...formData, status: newStatus };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleJoiningDateChange = (date: string) => {
    const updated = { ...formData, actualJoiningDate: date };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleRejectionDetailsUpdate = (field: 'rejectionDate' | 'rejectedBy' | 'rejectionReason', value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleTypeChange = (newType: EmployeeType) => {
    const updated = { ...formData, employeeType: newType };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleCategoryChange = (newCategory: CandidateCategory) => {
    const updated = { ...formData, category: newCategory };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleBusinessUnitChange = (newUnit: BusinessUnit) => {
    const updated = { ...formData, businessUnit: newUnit };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleDeleteProfile = () => {
    if (onDelete) {
      onDelete(candidate.id);
    }
  };

  const statusColors: Record<CandidateStatus, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'Screening': 'bg-yellow-100 text-yellow-700',
    'Interview': 'bg-purple-100 text-purple-700',
    'Hired': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
  };

  const labelClass = "text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-widest";

  const getRepoIcon = (type: EmployeeType) => {
    switch (type) {
      case 'Current': return <Folder size={12} />;
      case 'Proposed': return <TrendingUp size={12} />;
      case 'Requirement': return <HelpCircle size={12} />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:relative print:p-0 print:bg-white print:block">
        <style>{`
          @media print {
            aside, header, nav, .print-hide { display: none !important; }
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .bg-white { background: white !important; }
            .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
            .h-[90vh] { height: auto !important; }
            .fixed { position: relative !important; }
            .max-w-5xl { max-width: 100% !important; border: none !important; }
            .overflow-y-auto { overflow: visible !important; }
            .rounded-2xl { border-radius: 0 !important; }
            .p-8 { padding: 20pt !important; }
            .border-l-4 { border-left-width: 2pt !important; }
          }
        `}</style>
        
        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:h-auto print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:bg-white">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 print:shadow-none">
                <span className="text-2xl font-bold">{formData.name ? formData.name.charAt(0) : '?'}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800">{candidate.name || 'New Entry'}</h2>
                  <div className="flex items-center gap-1.5 bg-slate-200 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 border border-slate-300 shrink-0">
                    <Hash size={10} />
                    {candidate.fileReferenceId}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColors[formData.status]}`}>
                    {formData.status}
                  </span>
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                    <Building2 size={10} />
                    {formData.businessUnit || 'Avante Facade'}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                    <Layers size={10} />
                    {formData.category}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    formData.employeeType === 'Current' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : formData.employeeType === 'Requirement'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {formData.employeeType || 'Proposed'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 print-hide">
              <button 
                onClick={handleDownloadDossier}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <FileDown size={18} />
                DOWNLOAD PDF
              </button>
              <button 
                onClick={handleExportCandidate}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-all border border-slate-200"
              >
                <Download size={14} />
                JSON
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white border-b border-slate-100 px-6 print-hide">
            <button 
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Credentials & Exp
            </button>
            <button 
              onClick={() => setActiveTab('psychometric')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'psychometric' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <Brain size={14} />
              Psychometric Profile
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/30 print:overflow-visible print:bg-white">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1 print:gap-8">
              <div className="space-y-8">
                {/* HIRED: Date of Joining Section */}
                {formData.status === 'Hired' && (
                  <section className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl ring-4 ring-emerald-100 shadow-xl shadow-emerald-900/5 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg">
                        <PartyPopper size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Onboarding Confirmation</h4>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Marking the beginning of the journey</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block ml-1">Confirm Actual Joining Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={formData.actualJoiningDate || ''}
                          onChange={(e) => handleJoiningDateChange(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-emerald-100 rounded-2xl text-sm font-black text-emerald-800 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                        <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                      </div>
                      {formData.actualJoiningDate && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase mt-2 bg-white/50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle size={12} /> Date confirmed for roadmap sync
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* REJECTED: Rejection Audit Section */}
                {formData.status === 'Rejected' && (
                  <section className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl ring-4 ring-rose-100 shadow-xl shadow-rose-900/5 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-600 text-white rounded-xl shadow-lg">
                        <FileX size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-rose-800 uppercase tracking-tight">Rejection Audit</h4>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Post-evaluation findings</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-rose-700 uppercase tracking-widest ml-1">Rejection Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={formData.rejectionDate || ''}
                              onChange={(e) => handleRejectionDetailsUpdate('rejectionDate', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-800 focus:ring-2 focus:ring-rose-500/20 outline-none"
                            />
                            <Calendar size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-rose-700 uppercase tracking-widest ml-1">Rejected By</label>
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Name of reviewer"
                              value={formData.rejectedBy || ''}
                              onChange={(e) => handleRejectionDetailsUpdate('rejectedBy', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-800 focus:ring-2 focus:ring-rose-500/20 outline-none"
                            />
                            <UserX size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-400" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-rose-700 uppercase tracking-widest ml-1">Reason for Rejection</label>
                        <textarea 
                          placeholder="Provide detailed feedback or specific constraints..."
                          value={formData.rejectionReason || ''}
                          onChange={(e) => handleRejectionDetailsUpdate('rejectionReason', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Interview Management Section */}
                <section className={`p-6 rounded-3xl border-2 transition-all ${formData.status === 'Interview' ? 'bg-purple-50 border-purple-200 ring-4 ring-purple-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${formData.status === 'Interview' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                        <Calendar size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Pipeline Scheduling</h4>
                    </div>
                    {formData.status === 'Interview' && (
                      <span className="text-[9px] font-black text-purple-600 uppercase animate-pulse">Action Required</span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {(formData.interviews || []).length > 0 ? (
                      formData.interviews?.map((it) => (
                        <div key={it.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-sm group relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interview Date</span>
                                <span className="text-xs font-black text-slate-800">{new Date(it.date).toLocaleString()}</span>
                              </div>
                              <div className="w-px h-8 bg-slate-100" />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interviewer</span>
                                <span className="text-xs font-bold text-slate-700">{it.interviewer}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                               <button 
                                onClick={() => handleNotifyWhatsApp(it)}
                                title="Notify via WhatsApp"
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                               >
                                <Smartphone size={16} />
                               </button>
                               <button 
                                onClick={() => handleNotifyEmail(it)}
                                title="Notify via Email"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                               >
                                <Mail size={16} />
                               </button>
                               <button onClick={() => handleRemoveInterview(it.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                               </button>
                            </div>
                          </div>
                          {(it.interviewerPhone || it.interviewerEmail) && (
                            <div className="flex gap-3 pt-2 border-t border-slate-50">
                              {it.interviewerPhone && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Smartphone size={10} /> {it.interviewerPhone}</span>}
                              {it.interviewerEmail && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Mail size={10} /> {it.interviewerEmail}</span>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No interviews scheduled yet</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date & Time</label>
                        <input 
                          type="datetime-local"
                          value={newInterviewDate}
                          onChange={(e) => setNewInterviewDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Interviewer Name</label>
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="e.g. John Doe"
                            value={newInterviewer}
                            onChange={(e) => setNewInterviewer(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 outline-none"
                          />
                          <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Interviewer Phone</label>
                        <div className="relative">
                          <input 
                            type="tel"
                            placeholder="+91 00000 00000"
                            value={newInterviewerPhone}
                            onChange={(e) => setNewInterviewerPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 outline-none"
                          />
                          <Smartphone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Interviewer Email</label>
                        <div className="relative">
                          <input 
                            type="email"
                            placeholder="john@avantefacade.com"
                            value={newInterviewerEmail}
                            onChange={(e) => setNewInterviewerEmail(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 outline-none"
                          />
                          <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddInterview}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Plus size={16} /> SCHEDULE INTERVIEW
                    </button>
                  </div>
                </section>

                <section className="print:hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className={labelClass}>Business Unit</h4>
                      <div className="relative mt-2">
                        <select 
                          value={formData.businessUnit}
                          onChange={(e) => handleBusinessUnitChange(e.target.value as BusinessUnit)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                        >
                          {BUSINESS_UNITS.map(bu => (
                            <option key={bu} value={bu}>{bu}</option>
                          ))}
                        </select>
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <h4 className={labelClass}>Department</h4>
                      <div className="relative mt-2">
                        <select 
                          value={formData.category}
                          onChange={(e) => handleCategoryChange(e.target.value as CandidateCategory)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h4 className={labelClass}>Contact & Role</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 print:grid-cols-2">
                     <div className="bg-white p-3 rounded-lg border border-slate-200">
                       <div className="text-[9px] text-slate-400 font-bold uppercase">Email</div>
                       <div className="text-sm font-semibold text-slate-800 truncate">{formData.email || 'N/A'}</div>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200">
                       <div className="text-[9px] text-slate-400 font-bold uppercase">Phone</div>
                       <div className="text-sm font-semibold text-slate-800">{formData.phone || 'N/A'}</div>
                     </div>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className={labelClass}>Professional History</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-line text-sm text-slate-700 leading-relaxed print:max-h-none">
                    {candidate.experience}
                  </div>
                </section>
                <section>
                  <h4 className={labelClass}>Bio Summary</h4>
                  <p className="text-sm text-slate-600 italic border-l-4 border-blue-500 pl-4 py-1 leading-relaxed">{candidate.summary}</p>
                </section>
                <section>
                  <h4 className={labelClass}>Skills Matrix</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.skills.map(s => <span key={s} className="px-3 py-1 bg-white text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">{s}</span>)}
                  </div>
                </section>
              </div>

              {/* Behavior Analysis included in print Dossier if exists */}
              {candidate.behavioralInsight && (
                <div className="col-span-full border-t border-slate-200 pt-8 mt-4">
                  <h4 className={labelClass}>AI Behavioral Dossier</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 print:grid-cols-3">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400">Ownership</span>
                        <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed">{candidate.behavioralInsight.attitude.summary}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400">Growth</span>
                        <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed">{candidate.behavioralInsight.growth.summary}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400">Leadership</span>
                        <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed">{candidate.behavioralInsight.leadership.summary}</p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Repository:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {REPOSITORIES.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        formData.employeeType === type 
                          ? 'bg-white shadow-sm ring-1 ring-slate-200 ' + 
                            (type === 'Current' ? 'text-green-600' : type === 'Requirement' ? 'text-purple-600' : 'text-orange-600')
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {getRepoIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Interview Stage:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {STATUSES.map(stat => (
                    <button
                      key={stat}
                      onClick={() => handleStatusChange(stat)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        formData.status === stat 
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {onDelete && (
                <button 
                  onClick={handleDeleteProfile}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} /> DELETE PROFILE
                </button>
              )}
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                FINISH REVIEW
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isClarityAssistantOpen && <AIClarityAssistant candidate={candidate} onClose={() => setIsClarityAssistantOpen(false)} />}
    </>
  );
};

export default CandidateProfile;
