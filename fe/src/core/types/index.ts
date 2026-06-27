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

export interface Donation {
  id?: string;
  donorUserId: string;
  amount: number;
  type: DonationType;
  createdAt: Date | string;
  teacherProfileId?: string;
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
