import { mapTeachersWithInstitution } from '../../../core/domain/teacherDisplay';
import { Donation, DonationType, ReportWithDetails, LedgerEntry } from '../../../core/types';
import { donationRepository, teacherRepository, reportRepository } from '../../../core/db/repositories';

export const fundingService = {
  async getDonationHistory(_donorUserId: string): Promise<Donation[]> {
    return donationRepository.getByDonorUserId(_donorUserId);
  },

  async getAllTransactions(): Promise<Donation[]> {
    return donationRepository.getAll();
  },

  async makeDonation(
    donorUserId: string,
    amount: number,
    type: DonationType,
    teacherProfileId?: string,
    proofUrl?: string,
  ): Promise<Donation> {
    if (amount <= 0) {
      throw new Error('Nominal donasi harus lebih besar dari Rp 0.');
    }
    return donationRepository.save({
      donorUserId,
      amount,
      type,
      createdAt: new Date().toISOString(),
      teacherProfileId,
      proofUrl,
    });
  },

  async verifyDonation(donationId: string, approve: boolean, invoiceNumber?: string) {
    return donationRepository.verify(donationId, approve, invoiceNumber);
  },

  async createDonationInvoice(input: {
    donorUserId: string;
    amount: number;
    type: DonationType;
    teacherProfileId?: string;
    invoiceNumber?: string;
  }) {
    return donationRepository.createInvoice(input);
  },

  async disburseToTeacher(teacherProfileId: string, amount: number, description?: string) {
    return donationRepository.disburse({ teacherProfileId, amount, description });
  },

  async getCampaignProgress() {
    return donationRepository.getCampaignProgress();
  },

  async getLedger(): Promise<LedgerEntry[]> {
    return donationRepository.getLedger();
  },

  async getApprovedTeachersForDonors() {
    const approved = await teacherRepository.getApproved();
    return mapTeachersWithInstitution(approved);
  },

  async getApprovedMonthlyReportsForFeed(): Promise<ReportWithDetails[]> {
    return reportRepository.getWithDetails(true);
  },
};
