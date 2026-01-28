
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Position, CandidateStatus, CandidateCategory } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, TrendingUp, Users, Target, Loader2, ArrowRight, Zap, 
  BarChart, Calendar, ChevronDown, History, BarChart3, LineChart,
  Filter, Building2, Layers, PieChart, Activity
} from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface FlashReportProps {
  candidates: Candidate[];
  positions: Position[];
}

const DEPTS: (CandidateCategory | 'All')[] = [
  'All',
  'Design', 
  'Engineering', 
  'Project management', 
  'Resource management', 
  'Finance and Admin', 
  'BD & Marketing'
];

const FlashReport: React.FC<FlashReportProps> = ({ candidates, positions }) => {
  const [globalInsight, setGlobalInsight] = useState<string>('');
  const [deptInsight, setDeptInsight] = useState<string>('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  
  // Selection states
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [selectedDept, setSelectedDept] = useState<CandidateCategory | 'All'>('All');

  // Derive unique months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    candidates.forEach(c => {
      const date = new Date(c.createdAt);
      months.add(date.toISOString().slice(0, 7));
    });
    months.add(currentMonthKey);
    return Array.from(months).sort().reverse();
  }, [candidates]);

  // Dynamic Funnel Data based on Department
  const deptFunnel = useMemo(() => {
    const filtered = selectedDept === 'All' 
      ? candidates 
      : candidates.filter(c => c.category === selectedDept);
    
    const stages: { label: CandidateStatus; count: number; color: string; textColor: string }[] = [
      { label: 'New', count: filtered.filter(c => c.status === 'New').length, color: 'bg-blue-500', textColor: 'text-blue-500' },
      { label: 'Screening', count: filtered.filter(c => c.status === 'Screening').length, color: 'bg-amber-500', textColor: 'text-amber-500' },
      { label: 'Interview', count: filtered.filter(c => c.status === 'Interview').length, color: 'bg-purple-500', textColor: 'text-purple-500' },
      { label: 'Hired', count: filtered.filter(c => c.status === 'Hired').length, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    ];

    const total = filtered.length;
    return { stages, total };
  }, [candidates, selectedDept]);

  // Global Insights effect
  useEffect(() => {
    generateGlobalInsight();
  }, [candidates]);

  // Departmental Insights effect
  useEffect(() => {
    generateDeptInsight();
  }, [selectedDept, candidates]);

  const generateGlobalInsight = async () => {
    if (candidates.length === 0) return;
    setIsGlobalLoading(true);
    try {
      const summary = `Total Candidates: ${candidates.length}. Funnel: ${JSON.stringify(deptFunnel.stages)}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a 2-sentence executive summary of the recruitment pipeline health. Data: ${summary}`,
        config: { systemInstruction: "You are a Chief People Officer." }
      });
      setGlobalInsight(response.text || '');
    } catch (err) {
      setGlobalInsight('Failed to generate insights.');
    } finally { setIsGlobalLoading(false); }
  };

  const generateDeptInsight = async () => {
    if (deptFunnel.total === 0) {
      setDeptInsight(`No data available for ${selectedDept}.`);
      return;
    }
    setIsDeptLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the ${selectedDept} department's recruitment funnel: ${JSON.stringify(deptFunnel.stages)}. Highlight one strength and one bottleneck.`,
        config: { systemInstruction: "You are a Talent Acquisition Lead." }
      });
      setDeptInsight(response.text || '');
    } catch (err) {
      setDeptInsight('Insights unavailable.');
    } finally { setIsDeptLoading(false); }
  };

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg"><Zap size={18} /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">RT Intelligence Engine</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Flash Report</h2>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Real-time recruitment analytics</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Pipeline</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{candidates.length}</span>
              <Users size={16} className="text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Departmental Funnel Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Departmental Intelligence</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Toggle focus to analyze specific verticals</p>
            </div>
          </div>
          
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
            {DEPTS.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  selectedDept === dept 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-800'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel Visualizer */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={24} />
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {selectedDept === 'All' ? 'All Departments' : selectedDept} Funnel
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Total Volume</span>
                <span className="text-xl font-black text-slate-800">{deptFunnel.total}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-3">
              {deptFunnel.stages.map((stage, idx) => {
                const widthPercent = 100 - (idx * 15);
                const stagePercent = deptFunnel.total > 0 ? (stage.count / deptFunnel.total) * 100 : 0;
                
                return (
                  <div key={stage.label} className="group relative flex flex-col items-center">
                    <div className="w-full flex justify-between items-center px-4 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${stage.textColor}`}>{stage.label}</span>
                      <span className="text-sm font-black text-slate-800">{stage.count} <span className="text-[9px] text-slate-400 font-bold uppercase">Profiles</span></span>
                    </div>
                    <div className="w-full flex justify-center">
                      <div 
                        style={{ width: `${widthPercent}%` }} 
                        className={`h-16 ${stage.color} rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl group-hover:scale-[1.02] relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-white text-xl font-black tracking-tighter">
                          {stagePercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {idx < deptFunnel.stages.length - 1 && (
                       <div className="h-4 flex flex-col items-center">
                          <div className="w-px h-full bg-slate-200 dashed" />
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Behavioral / Vertical Insight */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex-1 border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={120} className="text-blue-400" />
              </div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Vertical Insight
                  </h3>
                </div>
                {isDeptLoading && <Loader2 size={16} className="animate-spin text-blue-400" />}
              </div>
              
              <div className="relative z-10">
                <div className="text-slate-300 leading-relaxed font-medium whitespace-pre-line text-sm border-l-2 border-blue-500/30 pl-6 italic">
                  {deptFunnel.total > 0 ? (deptInsight || "Analyzing departmental patterns...") : "Select a department with active candidates to generate vertical intelligence."}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI Engine Active</span>
                </div>
                <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-2">
                  Deep Audit Report <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion Quality</p>
                <div className="flex items-center gap-3">
                   <h4 className="text-2xl font-black text-slate-800">
                    {deptFunnel.total > 0 ? ((deptFunnel.stages[3].count / deptFunnel.total) * 100).toFixed(1) : '0'}%
                   </h4>
                   <div className="p-1 bg-green-50 text-green-600 rounded-lg">
                     <TrendingUp size={16} />
                   </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Interview Depth</p>
                <div className="flex items-center gap-3">
                   <h4 className="text-2xl font-black text-slate-800">
                    {deptFunnel.total > 0 ? ((deptFunnel.stages[2].count / deptFunnel.total) * 100).toFixed(1) : '0'}%
                   </h4>
                   <div className="p-1 bg-purple-50 text-purple-600 rounded-lg">
                     <PieChart size={16} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Context Section */}
      <div className="pt-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-slate-800 text-white rounded-lg"><LineChart size={18} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Historical Benchmarking</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Global Performance</h2>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Analysis Window</span>
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <History className="text-slate-400" size={20} />
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">Global Insight Summary</h4>
              {isGlobalLoading && <Loader2 size={12} className="animate-spin text-blue-600" />}
           </div>
           <p className="text-slate-700 text-sm leading-relaxed font-medium border-l-4 border-slate-100 pl-6">
              {globalInsight || "Collating global workforce signals..."}
           </p>
        </div>
      </div>
    </div>
  );
};

const UserPlus = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
);

export default FlashReport;
