import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
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
        src="/brand/bea-guru-logo.png"
        alt="Bea Guru Indonesia"
        className={`${heightClasses[size]} w-auto object-contain rounded-lg`}
      />
    </div>
  );
};

export default Logo;
