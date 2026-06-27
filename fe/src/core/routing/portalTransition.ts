const PORTAL_ENTRY_KEY = 'bea-portal-entry';
const PORTAL_FOG_LOCAL_KEY = 'bea-portal-fog-local';

/** Durasi transisi login → portal (ms). Total ~1.75s cover + reveal. */
export const PORTAL_FOG_TIMING = {
  coverMs: 550,
  revealMs: 1200,
  roleCoverMs: 550,
  roleUncoverMs: 850,
} as const;

export const PORTAL_FOG_EASE = [0.16, 1, 0.3, 1] as const;

export type LoginTransitionPhase = 'idle' | 'cover' | 'reveal';

export type PortalEntryFromAuth = {
  entryAnim: boolean;
  localFog: boolean;
};

export function markPortalEntryFromAuth(options?: { localFog?: boolean }): void {
  try {
    sessionStorage.setItem(PORTAL_ENTRY_KEY, '1');
    if (options?.localFog) {
      sessionStorage.setItem(PORTAL_FOG_LOCAL_KEY, '1');
    }
  } catch {
    /* private browsing */
  }
}

export function consumePortalEntryFromAuth(): PortalEntryFromAuth {
  try {
    const entryAnim = sessionStorage.getItem(PORTAL_ENTRY_KEY) === '1';
    const localFog = sessionStorage.getItem(PORTAL_FOG_LOCAL_KEY) === '1';
    sessionStorage.removeItem(PORTAL_ENTRY_KEY);
    sessionStorage.removeItem(PORTAL_FOG_LOCAL_KEY);
    return { entryAnim, localFog };
  } catch {
    return { entryAnim: false, localFog: false };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
