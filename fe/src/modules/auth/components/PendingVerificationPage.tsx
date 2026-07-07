import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePendingAccountPoll } from '../hooks/usePendingAccountPoll';
import { UserRole } from '@core/types';
import { PAGE_META } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { Clock, Mail } from 'lucide-react';
import { portalPathForTab } from '@core/routing/tabRoutes';

export function PendingVerificationPage() {
  const { user } = useAuth();
  usePageMeta(PAGE_META.pendingVerification);
  usePendingAccountPoll(true);

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
          Halaman ini juga mengecek status otomatis saat sinyal tersedia (tanpa perlu refresh manual).
        </p>
        {isTeacher && (
          <div className="pending-verify-actions">
            <Link
              to={portalPathForTab('Pengajuan Profil')}
              className="ui-btn ui-btn--primary ui-btn--md inline-flex items-center justify-center no-underline"
            >
              Lengkapi / ubah profil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
