import React, { useState } from 'react';
import { LOGO_FALLBACK_URL, LOGO_URL } from '@core/constants/mediaUrls';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const [src, setSrc] = useState(LOGO_URL);
  const heightClasses = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28',
    hero: 'h-36 md:h-44',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={src}
        alt="Bea Guru Indonesia"
        className={`${heightClasses[size]} w-auto object-contain rounded-lg`}
        onError={() => {
          if (src !== LOGO_FALLBACK_URL) setSrc(LOGO_FALLBACK_URL);
        }}
      />
    </div>
  );
};

export default Logo;
