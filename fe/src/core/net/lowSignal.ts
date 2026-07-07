/** Util jaringan lemah — guru di daerah pelosok, sinyal tidak stabil. */

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function isPageVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Tunggu online lagi (max ms), lalu lanjut — untuk retry setelah sinyal balik. */
export function waitForOnline(maxMs = 12_000): Promise<boolean> {
  if (isBrowserOnline()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      window.clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      resolve(ok);
    };
    const onOnline = () => done(true);
    const timer = window.setTimeout(() => done(false), maxMs);
    window.addEventListener('online', onOnline, { once: true });
  });
}

export function isRetryableNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: string }).code) : '';
  if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') return true;
  const message = 'message' in err ? String((err as { message?: string }).message).toLowerCase() : '';
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('connection')
  );
}

/** Retry idempotent request — backoff singkat, tunggu sinyal jika offline. */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 900;
  let last: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 0 && !isBrowserOnline()) {
        await waitForOnline(12_000);
      }
      return await fn();
    } catch (err) {
      last = err;
      if (attempt >= retries || !isRetryableNetworkError(err)) break;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw last;
}

/** Interval polling — hanya saat tab aktif & online (hemat kuota). */
export function onVisibleOnlineInterval(
  cb: () => void,
  intervalMs: number,
): () => void {
  let id: number | undefined;

  const tick = () => {
    if (isPageVisible() && isBrowserOnline()) cb();
  };

  const arm = () => {
    if (id !== undefined) window.clearInterval(id);
    id = window.setInterval(tick, intervalMs);
  };

  const onVisibility = () => {
    if (isPageVisible()) tick();
  };

  arm();
  window.addEventListener('focus', tick);
  window.addEventListener('online', tick);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    if (id !== undefined) window.clearInterval(id);
    window.removeEventListener('focus', tick);
    window.removeEventListener('online', tick);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
