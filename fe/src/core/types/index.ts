export enum UserRole {
  TEACHER = 'TEACHER',
  DONOR = 'DONOR',
  VALIDATOR = 'VALIDATOR',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  NO_ROLE = 'NO_ROLE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
}

export interface User {
  id: string;
  email: string;
  role: UserRole | null;
  name: string;
  accountStatus: AccountStatus;
}

export interface Institution {
  id: string;
  name: string;
  address: string;
  validatorUserId: string;
}

export enum ApplicationStatus {
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface TeacherProfile {
  id?: string;
  userId: string;
  institutionId: string;
  institutionName?: string;
  fullName: string;
  photoUrl: string;
  teachingPhotoUrl: string;
  jobTitle: string;
  yearsOfService: number;
  age?: number;
  monthlySalary: number;
  phoneNumber: string;
  bankName?: string;
  bankAccountNumber: string;
  totalReceivedCount?: number;
  totalReceivedAmount?: number;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  reason: string;
  status: ApplicationStatus;
  rejectedBy?: 'VALIDATOR' | 'ADMIN' | null;
  isPublished?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export enum DonationType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

export enum DonationVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface Donation {
  id?: string;
  donorUserId: string;
  amount: number;
  type: DonationType;
  createdAt: Date | string;
  teacherProfileId?: string;
  verificationStatus?: DonationVerificationStatus;
  proofUrl?: string;
  invoiceNumber?: string;
  donorName?: string;
  donorEmail?: string;
  teacherName?: string;
}

export interface DonorSummary {
  id: string;
  email: string;
  name: string;
  phone: string;
  totalDonation: number;
  donationCount: number;
  isActive: boolean;
}

export interface MonthlyReport {
  id?: string;
  teacherUserId: string;
  photoUrl: string;
  description: string;
  submittedAt: Date | string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ReportWithDetails {
  report: MonthlyReport;
  teacherName: string;
  teacherPhoto: string;
  institutionName: string;
  jobTitle: string;
}

export interface CampaignProgress {
  target: number;
  raised: number;
  percentage: number;
  donorCount: number;
  fundedTeachersCount: number;
  publishedTeachersCount?: number;
  transferCount?: number;
  pendingDonationsCount?: number;
  monthlyTeacherTarget?: number;
  currentTeacherCount?: number;
}

export interface LedgerEntry {
  id: string;
  type: 'IN' | 'OUT';
  description: string;
  amount: number;
  occurredAt: string;
  source?: string;
}

export interface AdminAuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface MonthlyAnalyticsPoint {
  month: string;
  label: string;
  donationAmount: number;
  donationCount: number;
  donorCount: number;
  transferAmount: number;
  teachersCumulative: number;
  cumulativeDonation: number;
  cumulativeTransfer: number;
  source: 'computed' | 'import' | string;
}

export interface AnalyticsSummary {
  totalDonation: number;
  totalDonors: number;
  avgDonationPerMonth: number;
  totalTransfer: number;
  undisbursed: number;
  teachersStart: number;
  teachersEnd: number;
  teacherGrowthPct: number;
  totalDonationCount: number;
}

export interface ProgramAnalytics {
  periodFrom: string;
  periodTo: string;
  months: MonthlyAnalyticsPoint[];
  summary: AnalyticsSummary;
}

export interface AnalyticsSnapshotInput {
  month: string;
  donationAmount?: number;
  donationCount?: number;
  donorCount?: number;
  transferAmount?: number;
  teachersCumulative?: number;
  source?: string;
  note?: string;
}

// AI Integration Types
export interface AiLogEntry {
  id?: string;
  userId: string;
  username: string;
  timestamp: string;
  model: string;
  action: 'chat' | 'ragSearch' | 'summarization' | 'assistance';
  tokensUsed: number;
  cost: number;
}

export interface RagDocument {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  embeddingPlaceholder?: number[];
}

export interface AiMemory {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
