import { DonationType, TeacherProfile } from '../types';
import { formatBankAccount } from '../utils/bank';

export type TeacherProfileDraft = {
  fullName: string;
  instId: string;
  jobTitle: string;
  yearsOfService: number | '';
  monthlySalary: number | '';
  bankAccount: string;
  phoneNumber: string;
  region: string;
  reason: string;
  profilePhoto: string;
  teachingPhoto: string;
};

export type MonthlyReportDraft = {
  step: 1 | 2 | 3;
  reportPhoto: string;
  subject: string;
  studentProgress: string;
  supportBenefit: string;
  reportDesc: string;
};

export type InstitutionDraft = {
  name: string;
  address: string;
  validatorUserId: string;
};

export type DonationDraft = {
  amount: number | '';
  type: DonationType;
  teacherProfileId: string;
};

export type AdminTermsDraft = {
  text: string;
};

export const EMPTY_TEACHER_PROFILE_DRAFT: TeacherProfileDraft = {
  fullName: '',
  instId: '',
  jobTitle: '',
  yearsOfService: '',
  monthlySalary: '',
  bankAccount: '',
  phoneNumber: '',
  region: '',
  reason: '',
  profilePhoto: '',
  teachingPhoto: '',
};

export const EMPTY_MONTHLY_REPORT_DRAFT: MonthlyReportDraft = {
  step: 1,
  reportPhoto: '',
  subject: '',
  studentProgress: '',
  supportBenefit: '',
  reportDesc: '',
};

export const EMPTY_INSTITUTION_DRAFT: InstitutionDraft = {
  name: '',
  address: '',
  validatorUserId: '',
};

export const EMPTY_DONATION_DRAFT: DonationDraft = {
  amount: '',
  type: DonationType.RECURRING,
  teacherProfileId: '',
};

export const DEFAULT_ADMIN_TERMS =
  'Ini adalah Syarat dan Ketentuan resmi Yayasan Bea Guru Indonesia yang berlaku bagi penerima manfaat. Semua donasi akan disalurkan secara transparan 100% dan akuntabel tanpa potongan kepada guru yang terverifikasi.';

export function teacherProfileToDraft(profile: TeacherProfile | null): TeacherProfileDraft {
  if (!profile) return { ...EMPTY_TEACHER_PROFILE_DRAFT };
  return {
    fullName: profile.fullName ?? '',
    instId: profile.institutionId ?? '',
    jobTitle: profile.jobTitle ?? '',
    yearsOfService: profile.yearsOfService ?? '',
    monthlySalary: profile.monthlySalary ?? '',
    bankAccount: formatBankAccount(profile.bankName, profile.bankAccountNumber),
    phoneNumber: profile.phoneNumber ?? '',
    region: profile.region ?? '',
    reason: profile.reason ?? '',
    profilePhoto: profile.photoUrl ?? '',
    teachingPhoto: profile.teachingPhotoUrl ?? '',
  };
}
