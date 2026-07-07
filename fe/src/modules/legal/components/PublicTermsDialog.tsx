import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchPublicTerms } from '@core/api/publicClient';
import { DEFAULT_ADMIN_TERMS } from '@core/draft/draftTypes';
import { SITE_ORG } from '@core/constants/siteMeta';

type PublicTermsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function PublicTermsDialog({ open, onClose }: PublicTermsDialogProps) {
  const [terms, setTerms] = useState(DEFAULT_ADMIN_TERMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetchPublicTerms()
      .then(setTerms)
      .catch(() => {
        /* default */
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="portal-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-sm select-none"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[min(85dvh,32rem)] flex flex-col rounded-2xl border border-bea-line bg-bea-ivory shadow-xl animate-slide-up"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-bea-line px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-bea-ink">Syarat & Ketentuan</h2>
            <p className="text-xs text-bea-sage mt-0.5">{SITE_ORG}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-bea-sage hover:bg-bea-ivory-light hover:text-bea-ink"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        <article className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-bea-ink whitespace-pre-wrap">
          {loading ? 'Memuat…' : terms}
        </article>
        <div className="border-t border-bea-line px-5 py-3">
          <button type="button" onClick={onClose} className="bea-btn-primary w-full min-h-10 text-sm">
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
