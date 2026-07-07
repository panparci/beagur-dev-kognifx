import { apiUpload } from '@core/api/client';

export type ImageUploadKind = 'teacher-profile' | 'teacher-teaching' | 'report';

export const uploadService = {
  async uploadDonationProof(file: File): Promise<string> {
    const result = await apiUpload<{ url: string }>('/api/v1/uploads/donation-proof', file);
    return result.url;
  },

  async uploadImage(kind: ImageUploadKind, file: File): Promise<string> {
    if (kind === 'report') {
      const result = await apiUpload<{ url: string }>('/api/v1/uploads/report-image', file);
      return result.url;
    }
    const result = await apiUpload<{ url: string }>('/api/v1/uploads/image', file, { kind });
    return result.url;
  },
};
