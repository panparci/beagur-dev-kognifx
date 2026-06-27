import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'soft' | 'flat';
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, variant = 'default' }) => {
  const isClickable = !!onClick;
  const surface =
    variant === 'flat'
      ? 'portal-card portal-card--flat'
      : variant === 'soft'
        ? 'portal-card portal-card--soft'
        : 'portal-card';

  return (
    <div
      onClick={onClick}
      className={`${surface} ${isClickable ? 'portal-card--clickable' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default Card;
