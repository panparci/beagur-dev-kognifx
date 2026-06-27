import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => (
  <span className={`ui-badge ui-badge--${variant} ${className}`.trim()}>{children}</span>
);

export default Badge;
