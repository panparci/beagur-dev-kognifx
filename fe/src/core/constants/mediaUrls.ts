/** CDN static assets — set VITE_R2_PUBLIC_BASE_URL in fe/.env (same as R2_PUBLIC_BASE_URL). */
function resolveR2Base(): string {
  const raw = (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? '';
  if (!raw) return '';
  // ponytail: reject malformed env (e.g. truncated URL) — fallback ke /static lokal
  if (!/^https:\/\/pub-[a-f0-9]+\.r2\.dev$/i.test(raw)) return '';
  return raw;
}

const R2_BASE = resolveR2Base();

const LOCAL_STATIC = {
  logo: '/brand/bea-guru-logo.png',
  mascot: '/static/maskot.gif',
} as const;

function r2Static(path: string, localFallback: string): string {
  // ponytail: R2 pub dev sering timeout — CDN hanya dipakai di production build
  if (!import.meta.env.PROD) return localFallback;
  return R2_BASE ? `${R2_BASE}/${path.replace(/^\//, '')}` : localFallback;
}

export const LOGO_URL = r2Static('static/brand/bea-guru-logo.webp', LOCAL_STATIC.logo);
export const LOGO_FALLBACK_URL = LOCAL_STATIC.logo;
export const MASCOT_URL = r2Static('static/maskot.gif', LOCAL_STATIC.mascot);
export const MASCOT_LOCAL_URL = LOCAL_STATIC.mascot;
export const MASCOT_FALLBACK_URL = '/maskot.mp4';
export const MASCOT_IS_GIF = MASCOT_URL.endsWith('.gif');
