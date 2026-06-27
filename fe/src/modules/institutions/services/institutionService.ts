import { Institution, User } from '../../../core/types';
import { institutionRepository } from '../../../core/db/repositories';

export const institutionService = {
  async getAllInstitutions(): Promise<Institution[]> {
    return institutionRepository.getAll();
  },

  async getValidators(): Promise<User[]> {
    return institutionRepository.getValidators();
  },

  async saveInstitution(inst: Institution): Promise<Institution> {
    if (!inst.name || !inst.address || !inst.validatorUserId) {
      throw new Error('Semua data institusi harus diisi dengan lengkap.');
    }
    return institutionRepository.save(inst);
  },
};
