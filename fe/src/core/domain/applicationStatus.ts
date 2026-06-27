import { ApplicationStatus } from '../types';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type StatusPerspective = 'teacher' | 'validator' | 'admin';

export function applicationStatusVariant(status?: ApplicationStatus): StatusBadgeVariant {
  switch (status) {
    case ApplicationStatus.APPROVED:
      return 'success';
    case ApplicationStatus.REJECTED:
      return 'danger';
    case ApplicationStatus.PENDING_APPROVAL:
      return 'info';
    case ApplicationStatus.PENDING_VALIDATION:
      return 'warning';
    default:
      return 'neutral';
  }
}

export function applicationStatusLabel(
  status?: ApplicationStatus,
  opts?: { perspective?: StatusPerspective; rejectedBy?: string | null }
): string {
  const perspective = opts?.perspective ?? 'admin';
  const rejectedBy = opts?.rejectedBy;

  if (perspective === 'teacher') {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return 'Disetujui & Aktif';
      case ApplicationStatus.PENDING_VALIDATION:
        return 'Menunggu Validasi Kepala Sekolah';
      case ApplicationStatus.PENDING_APPROVAL:
        return 'Divalidasi Kepsek, Menunggu Approval Yayasan';
      case ApplicationStatus.REJECTED:
        return 'Ditolak / Perlu Perbaikan';
      default:
        return 'Tidak Aktif';
    }
  }

  if (perspective === 'validator') {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return 'Diterima Final (Yayasan)';
      case ApplicationStatus.REJECTED:
        if (rejectedBy === 'VALIDATOR') return 'Ditolak Kepala Sekolah';
        if (rejectedBy === 'ADMIN') return 'Ditolak Yayasan';
        return 'Ditolak';
      case ApplicationStatus.PENDING_APPROVAL:
        return 'Disetujui Kepsek — Menunggu Yayasan';
      case ApplicationStatus.PENDING_VALIDATION:
        return 'Menunggu Validasi Kepsek';
      default:
        return status?.replace(/_/g, ' ') ?? '—';
    }
  }

  switch (status) {
    case ApplicationStatus.APPROVED:
      return 'Disetujui';
    case ApplicationStatus.REJECTED:
      return 'Ditolak';
    case ApplicationStatus.PENDING_APPROVAL:
      return 'Menunggu Yayasan';
    case ApplicationStatus.PENDING_VALIDATION:
      return 'Menunggu Kepsek';
    default:
      return status?.replace(/_/g, ' ') ?? '—';
  }
}
