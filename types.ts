export type Role = 'ADMIN' | 'CLIENT' | 'VERIFICATION_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: string;
  password?: string;
  // Subscription fields
  credits: number;
  subscriptionPlan?: 'STANDARD' | 'CORPORATE_PLUS' | 'CORPORATE_PRO' | 'ENTERPRISE';
  subscriptionExpiry?: string; // ISO Date for Enterprise
  status?: 'active' | 'suspended';
}

export enum VerificationStatus {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Verified = 'VERIFIED',
  Rejected = 'REJECTED',
  ReviewRequired = 'REVIEW_REQUIRED',
  PendingClientAction = 'PENDING_CLIENT_ACTION',
  InstitutionOutreach = 'INSTITUTION_OUTREACH'
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
  documentUrl?: string; 
  clientId: string;
  clientName: string;
  aiAnalysis?: AIAnalysisResult;
  timeline: VerificationStep[];
  
  // New fields for Officer Workflow
  verificationOutcome?: 'SUCCESS' | 'FAILURE';
  finalReportNote?: string;
  manualVerificationRequested?: boolean;
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  relatedRequestId?: string;
}

export type ViewState = 'dashboard' | 'new-request' | 'request-detail' | 'settings' | 'clients' | 'audit-log';

export type PaymentGateway = 'STRIPE' | 'PAYSTACK' | 'PAYPAL';

export interface PaymentConfig {
  activeGateway: PaymentGateway;
  keys: {
    stripe: { publishable: string; secret: string };
    paystack: { publicKey: string; secret: string };
    paypal: { clientId: string; secret: string };
  };
}

export interface PackageDef {
  id: string;
  name: string;
  price: number;
  credits: number | 'UNLIMITED';
  durationMonths?: number;
  description: string;
}

export interface ViewProps {
  navigate: (view: ViewState, id?: string) => void;
  currentId?: string;
  user?: User;
  onUpdateRequest?: (updatedRequest: VerificationRequest) => void;
  // User Management Props
  allUsers?: User[];
  onAddUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string, currentStatus?: string) => void;
  // Data for views
  requests?: VerificationRequest[];
  // Payment Props
  paymentConfig?: PaymentConfig;
  onUpdatePaymentConfig?: (config: PaymentConfig) => void;
  onTopUp?: (pkg: PackageDef) => void;
}