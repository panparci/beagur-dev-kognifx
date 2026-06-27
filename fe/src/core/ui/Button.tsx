import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export default Button;
