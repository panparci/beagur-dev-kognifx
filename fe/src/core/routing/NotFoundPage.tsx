import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { SITE_NAME } from '@core/constants/siteMeta';

const LOGO_SRC = '/brand/bea-guru-logo.png';

export function NotFoundPage() {
  usePageMeta({
    title: `Halaman tidak ditemukan — ${SITE_NAME}`,
    description: 'Alamat tidak tersedia. Kembali ke beranda Bea Guru.',
    noIndex: true,
  });

  return (
    <div className="app-not-found-minimal" role="status" aria-live="polite">
      <img src={LOGO_SRC} alt="Bea Guru Indonesia" className="app-not-found-minimal__logo" />
      <p className="app-not-found-minimal__text">Halaman tidak ditemukan.</p>
      <Link to="/" className="app-not-found-minimal__link">
        Kembali ke beranda Bea Guru
      </Link>
    </div>
  );
}
