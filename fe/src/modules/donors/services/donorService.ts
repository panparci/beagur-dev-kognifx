import { DonorSummary } from '@core/types';
import { donorRepository } from '@core/db/repositories';

export const donorService = {
  async getAllDonors(): Promise<DonorSummary[]> {
    return donorRepository.getAll();
  },

  async saveDonor(donor: { id?: string; email: string; name: string; phone: string }): Promise<DonorSummary> {
    return donorRepository.save(donor);
  },

  async deactivateDonor(donorId: string): Promise<void> {
    return donorRepository.deactivate(donorId);
  },
};
