import { TeacherProfile } from '../types';

const DEFAULT_INSTITUTION = 'Sekolah Terdaftar';

export type TeacherWithInstitution = {
  profile: TeacherProfile;
  institutionName: string;
};

export function mapTeachersWithInstitution(
  items: TeacherProfile[],
  fallback = DEFAULT_INSTITUTION,
): TeacherWithInstitution[] {
  return items.map((profile) => ({
    profile,
    institutionName: profile.institutionName?.trim() || fallback,
  }));
}

export function defaultInstitutionName(name?: string | null): string {
  return name?.trim() || DEFAULT_INSTITUTION;
}
