import React, { useState } from 'react';
import { LOGO_FALLBACK_URL, LOGO_URL } from '@core/constants/mediaUrls';

interface PortalLogoProps {
  className?: string;
  variant?: 'sidebar' | 'header';
}

const PortalLogo: React.FC<PortalLogoProps> = ({ className = '', variant = 'sidebar' }) => {
  const [src, setSrc] = useState(LOGO_URL);

  return (
    <img
      src={src}
      alt="Bea Guru Indonesia"
      className={`portal-logo portal-logo--${variant} ${className}`.trim()}
      onError={() => {
        if (src !== LOGO_FALLBACK_URL) setSrc(LOGO_FALLBACK_URL);
      }}
    />
  );
};

export default PortalLogo;
