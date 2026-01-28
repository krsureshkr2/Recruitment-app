
export type CandidateStatus = 'New' | 'Screening' | 'Interview' | 'Hired' | 'Rejected';

export type CandidateCategory = 
  | 'Engineering' 
  | 'Design' 
  | 'Resource management' 
  | 'Project management' 
  | 'Facade management' 
  | 'BD & Marketing' 
  | 'Finance and Admin' 
  | 'Facade forensic' 
  | 'Tactile materials'
  | 'Uncategorized';

export type BusinessUnit = 
  | 'Avante Facade' 
  | 'Tactile Materials' 
  | 'Facade Forensics' 
  | 'Facade Recladding' 
  | 'Corporate';

export type PositionStatus = 'Active' | 'On Hold' | 'Filled' | 'Cancelled';
export type EmployeeType = 'Current' | 'Proposed' | 'Requirement';

export interface Interview {
  id: string;
  date: string;
  interviewer: string;
  interviewerPhone?: string;
  interviewerEmail?: string;
  notes?: string;
}

export interface Position {
  id: string;
  candidateName?: string; 
  category: CandidateCategory; 
  businessUnit: BusinessUnit;
  title: string; 
  requirement: string;
  targetJoiningDate?: string; 
  interviewStatus?: string; 
  actualJoiningDate?: string; 
  status: PositionStatus;
  employeeType: EmployeeType; 
  createdAt: number;
}

export interface BehavioralInsight {
  attitude: { rating: 'High' | 'Medium' | 'Low'; summary: string };
  growth: { primaryMotivator: 'Security' | 'Status' | 'Mastery'; summary: string };
  leadership: { intention: 'Solo High-Performer' | 'People Leader'; summary: string };
  swot: { 
    strengths: string[]; 
    weaknesses: string[]; 
    opportunities: string[]; 
    threats: string[] 
  };
  fullReport: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  education: string;
  experience: string;
  summary: string;
  role: string;
  status: CandidateStatus;
  category: CandidateCategory;
  businessUnit?: BusinessUnit;
  employeeType?: EmployeeType; 
  certifications: string[];
  fileReferenceId: string;
  resumeUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileDataUrl?: string;
  createdAt: number;
  isEnriched: boolean;
  behavioralInsight?: BehavioralInsight;
  interviews?: Interview[];
  actualJoiningDate?: string;
  rejectionDate?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  enrichedData?: {
    currentTitle?: string;
    recentHistory?: string[];
    summary?: string;
    verifiedLinkedin?: string;
    sources?: { title: string; web: { uri: string } }[];
  };
}

export interface ParseResult {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  education: string;
  experience: string;
  role: string;
  summary: string;
  category: CandidateCategory;
  businessUnit: BusinessUnit;
  linkedinUrl?: string;
  certifications: string[];
  fileReferenceId: string;
}
