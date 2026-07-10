import axios from 'axios';
import { apiGet, apiPost } from '@core/api/client';
import { Institution } from '@core/types';

function normalize(raw: Institution): Institution {
  return { ...raw, validatorUserId: raw.validatorUserId ?? '' };
}

export const validatorInstitutionService = {
  async getMine(): Promise<Institution | null> {
    try {
      return normalize(await apiGet<Institution>('/api/v1/validators/me/institution'));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async setup(name: string, address: string): Promise<Institution> {
    return normalize(
      await apiPost<Institution>('/api/v1/validators/me/institution', {
        name: name.trim(),
        address: address.trim(),
      }),
    );
  },
};
