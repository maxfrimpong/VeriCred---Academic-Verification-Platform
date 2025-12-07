export enum VerificationStatus {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Verified = 'VERIFIED',
  Rejected = 'REJECTED',
  ReviewRequired = 'REVIEW_REQUIRED'
}

export interface VerificationStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
  date?: string;
}

export interface VerificationRequest {
  id: string;
  candidateName: string;
  institution: string;
  degree: string;
  graduationYear: string;
  status: VerificationStatus;
  submissionDate: string;
  lastUpdated: string;
  documentUrl?: string; // In a real app this would be a cloud URL, here we use blob/base64
  aiAnalysis?: AIAnalysisResult;
  timeline: VerificationStep[];
}

export interface AIAnalysisResult {
  extractedName: string;
  extractedInstitution: string;
  extractedDegree: string;
  extractedDate: string;
  confidenceScore: number;
  authenticityNotes: string;
  isTampered: boolean;
}

export type ViewState = 'dashboard' | 'new-request' | 'request-detail';

export interface ViewProps {
  navigate: (view: ViewState, id?: string) => void;
  currentId?: string;
}