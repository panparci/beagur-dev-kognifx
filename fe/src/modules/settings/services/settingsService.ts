import { settingsRepository } from '../../../core/db/repositories';

const DEFAULT_TERMS =
  'Ini adalah Syarat dan Ketentuan resmi Yayasan Bea Guru Indonesia yang berlaku bagi penerima manfaat. Semua donasi akan disalurkan secara transparan 100% dan akuntabel tanpa potongan kepada guru yang terverifikasi.';

export const settingsService = {
  async getTerms(): Promise<string> {
    try {
      return await settingsRepository.getTerms();
    } catch {
      return DEFAULT_TERMS;
    }
  },

  async saveTerms(value: string): Promise<string> {
    return settingsRepository.saveTerms(value);
  },
};
