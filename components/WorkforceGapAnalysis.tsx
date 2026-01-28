
import React, { useState } from 'react';
import { Candidate, Position } from '../types';
import { 
  Building2, Users, Target, HelpCircle, 
  TrendingUp, Activity, ArrowRight, BarChart3, 
  CheckCircle2, AlertCircle, Edit3, Save, X, User
} from 'lucide-react';

interface WorkforceGapAnalysisProps {
  candidates: Candidate[];
  positions: Position[];
  manualRequirements: Record<string, number>;
  setManualRequirements: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const DEPTS_TO_DISPLAY = [
  'Design', 
  'Engineering', 
  'Project management', 
  'Resource management', 
  'Finance and Admin', 
  'BD & Marketing'
];

const WorkforceGapAnalysis: React.FC<WorkforceGapAnalysisProps> = ({ candidates, positions, manualRequirements, setManualRequirements }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempReqs, setTempReqs] = useState(manualRequirements);

  const getDeptStats = (dept: string) => {
    // Current Staff from Workforce Planning sheet where type is Current
    // Case-insensitive match for robustness
    const deptPositions = positions.filter(p => p.category.toLowerCase() === dept.toLowerCase());
    const currentStaffPositions = deptPositions.filter(p => p.employeeType === 'Current');
    const currentStaffCount = currentStaffPositions.length;
    const currentStaffNames = currentStaffPositions.map(p => p.candidateName || 'TBD').filter(name => name !== 'TBD');
    
    // Candidates in Interview stage in recruitment pipeline
    const interviewCount = candidates.filter(c => c.category.toLowerCase() === dept.toLowerCase() && c.status === 'Interview').length;
    
    // Candidates marked as Hired
    const hiredCount = candidates.filter(c => c.category.toLowerCase() === dept.toLowerCase() && c.status === 'Hired').length;
    
    // Manual target requirement
    const targetRequirement = manualRequirements[dept] || 0;
    
    return {
      current: currentStaffCount,
      currentStaffNames,
      proposedInterview: interviewCount,
      requirement: targetRequirement,
      hired: hiredCount,
      gap: Math.max(0, targetRequirement - (currentStaffCount + hiredCount))
    };
  };

  const handleSaveReqs = () => {
    setManualRequirements(tempReqs);
    setIsEditMode(false);
  };

  const handleCancelReqs = () => {
    setTempReqs(manualRequirements);
    setIsEditMode(false);
  };

  const overall = {
    current: positions.filter(p => p.employeeType === 'Current').length,
    proposedInterview: candidates.filter(c => c.status === 'Interview').length,
    hired: candidates.filter(c => c.status === 'Hired').length,
    totalRequirements: Object.values(manualRequirements).reduce((a: number, b: number) => a + b, 0)
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg"><Activity size={18} /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Strategic Workforce Analysis</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Resource Roadmap</h2>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Gap analysis & departmental goal tracking</p>
        </div>
        
        <div className="flex gap-3">
          {isEditMode ? (
            <>
              <button 
                onClick={handleCancelReqs}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                <X size={16} /> CANCEL
              </button>
              <button 
                onClick={handleSaveReqs}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                <Save size={16} /> SAVE TARGETS
              </button>
            </>
          ) : (
            <button 
              onClick={() => { setTempReqs(manualRequirements); setIsEditMode(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-all"
            >
              <Edit3 size={16} /> MANAGE GOALS
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</p>
              <h3 className="text-2xl font-black text-slate-800">{overall.current}</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Pulled from Workforce Planning</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interview Stage</p>
              <h3 className="text-2xl font-black text-slate-800">{overall.proposedInterview}</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Active Pipeline Candidates</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <HelpCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Headcount</p>
              <h3 className="text-2xl font-black text-slate-800">{overall.totalRequirements}</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase">Manual Goal Capacity</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
              <Target size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Gap to Goal</p>
              <h3 className="text-2xl font-black text-white">{Math.max(0, (overall.totalRequirements as number) - (overall.current + overall.hired))}</h3>
            </div>
          </div>
          <p className="text-[9px] text-white/60 font-medium">Headcount remaining to fill overall</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-600" />
            Departmental Roadmap
          </h3>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">
            <AlertCircle size={12} /> Live Sync Active
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Staff</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">In Interview</th>
                <th className="px-8 py-6 text-[11px] font-black text-purple-600 uppercase tracking-widest">Goal Requirement</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEPTS_TO_DISPLAY.map(dept => {
                const stats = getDeptStats(dept);
                const progress = stats.requirement > 0 
                  ? ((stats.current + stats.hired) / stats.requirement) * 100 
                  : 0;

                return (
                  <tr key={dept} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">{dept}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-800">{stats.current}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Active</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                           {stats.currentStaffNames.length > 0 ? (
                             stats.currentStaffNames.map((name, i) => (
                               <span key={i} className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                                 <User size={8} /> {name}
                               </span>
                             ))
                           ) : (
                             <span className="text-[8px] italic text-slate-300">No personnel mapped</span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Users size={14} />
                        </div>
                        <span className="text-sm font-bold text-blue-600">
                          {stats.proposedInterview} Candidates
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      {isEditMode ? (
                        <div className="relative w-24">
                          <input 
                            type="number" 
                            min="0"
                            value={tempReqs[dept] || 0}
                            onChange={(e) => setTempReqs({...tempReqs, [dept]: parseInt(e.target.value) || 0})}
                            className="w-full bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-2 text-xl font-black text-purple-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-purple-600">{stats.requirement}</span>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-purple-400 font-black uppercase leading-tight">Total Goal</span>
                            {stats.hired > 0 && (
                              <span className="text-[9px] text-green-500 font-black uppercase leading-tight flex items-center gap-1">
                                <CheckCircle2 size={8} /> {stats.hired} Hired
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-8 text-right">
                       <div className="inline-flex flex-col items-end">
                          <span className="text-lg font-black text-slate-800 mb-1">{progress.toFixed(0)}%</span>
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 90 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min(100, progress)}%` }} 
                             />
                          </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logic Note */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl flex items-start gap-4">
         <AlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
         <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
            <p className="font-black uppercase tracking-widest text-slate-700 mb-1">Roadmap Logic</p>
            <p>• <b>Current Staff</b> is automatically populated with names and counts from entries marked as 'Current' in your Workforce Planning sheet.</p>
            <p>• <b>In Interview</b> counts come directly from candidates currently at the 'Interview' stage in your Recruitment Pipeline.</p>
            <p>• <b>Requirement Goals</b> are manually set targets. Progress increases as personnel are added to 'Current' or marked as 'Hired'.</p>
         </div>
      </div>
    </div>
  );
};

export default WorkforceGapAnalysis;
