import React from 'react';
import PortalLogo from '@core/ui/PortalLogo';
import {
  LayoutDashboard,
  Heart,
  FileText,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

/** Static portal preview — ditampilkan blur penuh di belakang pemilihan peran. */
export function PortalOnboardingBackdrop() {
  return (
    <div className="portal-onboarding-preview" aria-hidden>
      <aside className="portal-sidebar portal-onboarding-preview__sidebar">
        <div className="portal-sidebar-brand">
          <div className="portal-sidebar-logo-wrap">
            <PortalLogo className="portal-sidebar-logo" />
          </div>
        </div>
        <nav className="portal-sidebar-nav">
          <span className="portal-nav-link portal-nav-link--active">
            <LayoutDashboard size={18} aria-hidden />
            Gambaran Umum
          </span>
          <span className="portal-nav-link">
            <Heart size={18} aria-hidden />
            Guru Penerima
          </span>
          <span className="portal-nav-link">
            <TrendingUp size={18} aria-hidden />
            Dampak Donasi
          </span>
          <span className="portal-nav-link">
            <BookOpen size={18} aria-hidden />
            Laporan Guru
          </span>
          <span className="portal-nav-link">
            <FileText size={18} aria-hidden />
            Riwayat Donasi
          </span>
        </nav>
        <div className="portal-sidebar-user">
          <p className="portal-sidebar-user-label">Masuk sebagai</p>
          <p className="portal-sidebar-user-name">Pengguna Bea Guru</p>
        </div>
      </aside>

      <div className="portal-onboarding-preview__main">
        <header className="portal-onboarding-preview__header">
          <h1 className="portal-onboarding-preview__title">Gambaran Umum</h1>
          <div className="portal-onboarding-preview__search" />
        </header>
        <div className="portal-onboarding-preview__stats">
          <div className="portal-onboarding-preview__stat" />
          <div className="portal-onboarding-preview__stat" />
          <div className="portal-onboarding-preview__stat" />
        </div>
        <div className="portal-onboarding-preview__panel">
          <div className="portal-onboarding-preview__line portal-onboarding-preview__line--lg" />
          <div className="portal-onboarding-preview__line" />
          <div className="portal-onboarding-preview__line" />
          <div className="portal-onboarding-preview__line portal-onboarding-preview__line--sm" />
        </div>
      </div>
    </div>
  );
}
