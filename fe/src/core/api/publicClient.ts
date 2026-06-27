import { CampaignProgress, TeacherProfile } from '../types';
import { apiGet, apiPost } from './client';

export const apiGetPublic = apiGet;
export const apiPostPublic = apiPost;

export async function fetchPublicCampaign() {
  return apiGetPublic<CampaignProgress>('/api/v1/public/campaign');
}

export async function fetchPublicTeachers(): Promise<TeacherProfile[]> {
  const rows = await apiGetPublic<TeacherProfile[]>('/api/v1/public/teachers');
  return Array.isArray(rows) ? rows : [];
}
