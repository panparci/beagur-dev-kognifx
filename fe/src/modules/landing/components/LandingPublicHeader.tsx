import { Link, useLocation } from 'react-router-dom';
import Logo from '@core/ui/Logo';

type LandingPublicHeaderProps = {
  onSwitchToAuth: () => void;
  onOpenTerms: () => void;
  termsOpen?: boolean;
};

const PAGE_LINKS = [
  { href: '/', label: 'Beranda', match: (p: string) => p === '/' },
  { href: '/keuangan', label: 'Keuangan TA 2025–2026', match: (p: string) => p.startsWith('/keuangan') },
] as const;

export function LandingPublicHeader({
  onSwitchToAuth,
  onOpenTerms,
  termsOpen = false,
}: LandingPublicHeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className="landing-header sticky top-0 z-20 border-b border-bea-line/60 bg-bea-ivory/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10 md:py-4">
        <Link to="/" className="shrink-0" aria-label="Beranda Bea Guru">
          <Logo size="md" className="max-w-[96px] md:max-w-[112px]" />
        </Link>

        <nav
          className="order-3 flex w-full flex-wrap items-center justify-center gap-1 md:order-2 md:w-auto md:flex-1 md:justify-center"
          aria-label="Navigasi utama"
        >
          {PAGE_LINKS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm ${
                  active
                    ? 'bg-bea-copper/15 text-bea-copper-dark'
                    : 'text-bea-sage hover:bg-bea-ivory-light hover:text-bea-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onOpenTerms}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm ${
              termsOpen
                ? 'bg-bea-copper/15 text-bea-copper-dark'
                : 'text-bea-sage hover:bg-bea-ivory-light hover:text-bea-ink'
            }`}
          >
            Syarat & Ketentuan
          </button>
        </nav>

        <button
          type="button"
          onClick={onSwitchToAuth}
          className="bea-btn-secondary order-2 min-h-10 shrink-0 px-4 text-sm md:order-3 md:px-5"
        >
          Masuk portal
        </button>
      </div>
    </header>
  );
}
