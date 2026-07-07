import { settingsRepository } from '../../../core/db/repositories';
import {
  DEFAULT_LANDING_CONTENT,
  LandingContent,
  parseLandingContent,
} from '../../../core/constants/landingContent';

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

  async getLandingContent(): Promise<LandingContent> {
    try {
      const raw = await settingsRepository.getLanding();
      return parseLandingContent(raw);
    } catch {
      return DEFAULT_LANDING_CONTENT;
    }
  },

  async saveLandingContent(content: LandingContent): Promise<LandingContent> {
    const raw = await settingsRepository.saveLanding(JSON.stringify(content));
    return parseLandingContent(raw);
  },
};
