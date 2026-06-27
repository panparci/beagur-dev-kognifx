import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { presentAppError } from '@core/ui/errorFallback';

const LOGO_SRC = '/brand/bea-guru-logo.png';

type AppErrorFallbackProps = {
  error: Error | null;
  onReload?: () => void;
};

export function AppErrorFallback({ error, onReload }: AppErrorFallbackProps) {
  const copy = presentAppError(error);
  const showTechnical = import.meta.env.DEV && copy.technicalNote;

  const reload = () => {
    if (onReload) {
      onReload();
      return;
    }
    window.location.reload();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="app-error-screen" role="alert" aria-live="assertive">
      <div className="app-error-card">
        <div className="app-error-card-accent" aria-hidden />

        <div className="app-error-brand">
          <img src={LOGO_SRC} alt="Bea Guru Indonesia" className="app-error-logo" />
        </div>

        <div className="app-error-icon-wrap" aria-hidden>
          <AlertTriangle size={22} strokeWidth={1.75} />
        </div>

        <h1 className="app-error-title">{copy.title}</h1>
        <p className="app-error-lead">{copy.lead}</p>
        <p className="app-error-text">{copy.explanation}</p>

        <div className="app-error-issue">
          <p className="app-error-issue-label">{copy.issueLabel}</p>
          <p className="app-error-issue-detail">{copy.issueDetail}</p>
        </div>

        <p className="app-error-wait">
          <span className="app-error-wait-dot" aria-hidden />
          {copy.waitNote}
        </p>

        {showTechnical ? (
          <details className="app-error-tech">
            <summary>Detail teknis (mode pengembangan)</summary>
            <code>{copy.technicalNote}</code>
          </details>
        ) : null}

        <div className="app-error-actions">
          <button type="button" className="app-error-btn app-error-btn--primary" onClick={reload}>
            <RefreshCw size={16} aria-hidden />
            Muat ulang halaman
          </button>
          <button type="button" className="app-error-btn app-error-btn--secondary" onClick={goHome}>
            <Home size={16} aria-hidden />
            Kembali ke beranda
          </button>
        </div>

        <p className="app-error-foot">
          Butuh bantuan? Hubungi tim Bea Guru melalui kanal resmi yang Bapak/Ibu kenal.
        </p>
      </div>
    </div>
  );
}
