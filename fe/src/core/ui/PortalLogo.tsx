import React from 'react';

/** Logo portal (sidebar & header mobile) — bukan login/landing. */
export const PORTAL_LOGO_SRC = '/ChatGPT Logo Design Edit Jun 27 2026.png';

interface PortalLogoProps {
  className?: string;
  variant?: 'sidebar' | 'header';
}

const PortalLogo: React.FC<PortalLogoProps> = ({ className = '', variant = 'sidebar' }) => (
  <img
    src={PORTAL_LOGO_SRC}
    alt="Bea Guru Indonesia"
    className={`portal-logo portal-logo--${variant} ${className}`.trim()}
  />
);

export default PortalLogo;
