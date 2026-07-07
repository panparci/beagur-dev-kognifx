/** Static UI assets — selalu dari origin yang sama (ramah sinyal pelosok). Upload guru tetap via API/R2. */
const LOCAL_STATIC = {
  logo: '/brand/bea-guru-logo.png',
  mascot: '/static/maskot.gif',
} as const;

export const LOGO_URL = LOCAL_STATIC.logo;
export const LOGO_FALLBACK_URL = LOCAL_STATIC.logo;
export const MASCOT_URL = LOCAL_STATIC.mascot;
export const MASCOT_LOCAL_URL = LOCAL_STATIC.mascot;
export const MASCOT_FALLBACK_URL = '/maskot.mp4';
export const MASCOT_IS_GIF = true;
