import { TeacherProfile, MonthlyReport, ApplicationStatus, ReportWithDetails } from '../../../core/types';
import { teacherRepository, reportRepository } from '../../../core/db/repositories';
import { parseBankAccount } from '../../../core/utils/bank';

import { mapTeachersWithInstitution } from '../../../core/domain/teacherDisplay';

export const teacherService = {
  async getProfileByUserId(userId: string): Promise<TeacherProfile | null> {
    return teacherRepository.getByUserId(userId);
  },

  async getAllProfiles(): Promise<TeacherProfile[]> {
    return teacherRepository.getAll();
  },

  async submitProfile(profile: TeacherProfile): Promise<TeacherProfile> {
    const bank = parseBankAccount(profile.bankAccountNumber);
    profile.bankName = bank.bankName;
    profile.bankAccountNumber = bank.bankAccountNumber;
    profile.status = ApplicationStatus.PENDING_VALIDATION;
    profile.createdAt = profile.createdAt || new Date().toISOString();
    return teacherRepository.save(profile);
  },

  async getReportsByTeacher(teacherUserId: string): Promise<MonthlyReport[]> {
    return reportRepository.getByTeacherUserId(teacherUserId);
  },

  async submitMonthlyReport(report: MonthlyReport): Promise<MonthlyReport> {
    report.submittedAt = new Date().toISOString();
    report.status = 'PENDING';
    return reportRepository.save(report);
  },

  async getPendingValidations(_validatorUserId: string): Promise<{ profile: TeacherProfile; institutionName: string }[]> {
    const items = await teacherRepository.getPendingValidation();
    return mapTeachersWithInstitution(items);
  },

  async getValidationHistory(_validatorUserId: string): Promise<{ profile: TeacherProfile; institutionName: string }[]> {
    const items = await teacherRepository.getValidationHistory();
    return mapTeachersWithInstitution(items);
  },

  async submitValidationDecision(profileId: string, approve: boolean): Promise<TeacherProfile> {
    return teacherRepository.validate(profileId, approve);
  },

  async getPendingApprovals(): Promise<{ profile: TeacherProfile; institutionName: string }[]> {
    const items = await teacherRepository.getPendingApproval();
    return mapTeachersWithInstitution(items);
  },

  async submitAdminDecision(profileId: string, approve: boolean): Promise<TeacherProfile> {
    return teacherRepository.approve(profileId, approve);
  },

  async getAllReportsWithDetails(): Promise<ReportWithDetails[]> {
    return reportRepository.getWithDetails(false);
  },

  async updateReportStatus(reportId: string, status: 'APPROVED' | 'REJECTED'): Promise<MonthlyReport> {
    return reportRepository.updateStatus(reportId, status);
  },
};
