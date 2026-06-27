import { TeacherProfile } from '../types';
import { findRegionByLabel, normalizeRegionKey, resolveRegionCoords } from './indonesiaRegions';

export type TeacherMapPoint = {
  id: string;
  name: string;
  jobTitle: string;
  institutionName: string;
  photoUrl: string;
  region: string;
  longitude: number;
  latitude: number;
};

export type TeacherLocationCluster = {
  key: string;
  region: string;
  longitude: number;
  latitude: number;
  teachers: TeacherMapPoint[];
};

export function teacherToMapPoint(teacher: TeacherProfile): TeacherMapPoint | null {
  const coords = resolveRegionCoords(teacher.region, teacher.latitude, teacher.longitude);
  if (!coords) return null;

  const canonicalRegion =
    findRegionByLabel(coords.region || teacher.region || '')?.label ||
    coords.region ||
    teacher.region?.trim() ||
    '';

  return {
    id: teacher.id ?? teacher.fullName,
    name: teacher.fullName,
    jobTitle: teacher.jobTitle,
    institutionName: teacher.institutionName?.trim() || 'Sekolah penerima bantuan',
    photoUrl: teacher.photoUrl,
    region: canonicalRegion,
    longitude: coords.longitude,
    latitude: coords.latitude,
  };
}

function clusterKey(point: TeacherMapPoint): string {
  if (point.region) {
    return normalizeRegionKey(point.region);
  }
  return `${point.latitude.toFixed(2)}:${point.longitude.toFixed(2)}`;
}

export function clusterTeachersByLocation(teachers: TeacherProfile[]): TeacherLocationCluster[] {
  const buckets = new Map<string, TeacherMapPoint[]>();

  for (const teacher of teachers) {
    const point = teacherToMapPoint(teacher);
    if (!point) continue;
    const key = clusterKey(point);
    const list = buckets.get(key);
    if (list) {
      list.push(point);
    } else {
      buckets.set(key, [point]);
    }
  }

  return Array.from(buckets.entries())
    .map(([key, clusterTeachers]) => {
      const region = clusterTeachers[0]?.region || '';
      const latitude =
        clusterTeachers.reduce((sum, item) => sum + item.latitude, 0) / clusterTeachers.length;
      const longitude =
        clusterTeachers.reduce((sum, item) => sum + item.longitude, 0) / clusterTeachers.length;

      return {
        key,
        region,
        latitude,
        longitude,
        teachers: clusterTeachers.sort((a, b) => a.name.localeCompare(b.name, 'id')),
      };
    })
    .sort((a, b) => a.region.localeCompare(b.region, 'id'));
}
