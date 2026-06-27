import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@core/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@core/types';
import { PAGE_META } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { Clock, Mail } from 'lucide-react';
import { portalPathForTab } from '@core/routing/tabRoutes';
import { OVERVIEW_TAB } from '@core/constants/tabs';

export function PendingVerificationPage() {
  const { user, logout } = useAuth();
  usePageMeta(PAGE_META.pendingVerification);

  const isTeacher = user?.role === UserRole.TEACHER;

  return (
    <div className="pending-verify-page">
      <div className="pending-verify-card">
        <div className="pending-verify-icon" aria-hidden>
          <Clock size={40} strokeWidth={1.5} />
        </div>
        <h1 className="pending-verify-title">Menunggu Verifikasi</h1>
        <p className="pending-verify-lead">
          {isTeacher
            ? 'Profil guru Anda sedang dalam antrian verifikasi oleh kepala sekolah dan tim yayasan.'
            : 'Akun kepala sekolah Anda sedang diverifikasi oleh tim yayasan. Anda akan dihubungi setelah disetujui.'}
        </p>
        <p className="pending-verify-note">
          <Mail size={16} className="inline mr-1.5 align-text-bottom" aria-hidden />
          Notifikasi akan dikirim ke <strong>{user?.email}</strong> setelah akun aktif.
        </p>
        <div className="pending-verify-actions">
          {isTeacher && (
            <Link to={portalPathForTab('Pengajuan Profil')}>
              <Button type="button">Lengkapi / ubah profil</Button>
            </Link>
          )}
          {!isTeacher && user?.role === UserRole.VALIDATOR && (
            <Link to={portalPathForTab(OVERVIEW_TAB)}>
              <Button type="button" variant="secondary">
                Lihat portal sementara
              </Button>
            </Link>
          )}
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
