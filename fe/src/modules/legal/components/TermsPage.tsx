import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicTerms } from '@core/api/publicClient';
import { DEFAULT_ADMIN_TERMS } from '@core/draft/draftTypes';

export function TermsPage() {
  const [terms, setTerms] = useState(DEFAULT_ADMIN_TERMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublicTerms()
      .then(setTerms)
      .catch(() => {
        /* keep default */
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bea-ivory px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-bea-copper-dark hover:underline">
          ← Kembali ke Beranda
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-bea-ink">Syarat & Ketentuan</h1>
        <p className="mt-1 text-sm text-bea-sage">Yayasan Bea Guru Indonesia</p>
        <article className="mt-6 whitespace-pre-wrap rounded-xl border border-bea-line bg-white p-6 text-sm leading-relaxed text-bea-ink shadow-sm">
          {loading ? 'Memuat...' : terms}
        </article>
      </div>
    </div>
  );
}
