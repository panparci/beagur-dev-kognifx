import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type FormNoticeProps = {
  variant: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  messages?: string[];
  children?: React.ReactNode;
  className?: string;
};

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
} as const;

export function FormNotice({ variant, title, messages, children, className = '' }: FormNoticeProps) {
  const Icon = ICONS[variant];
  const body = children ?? (
    messages && messages.length > 0 ? (
      <ul className="portal-form-notice-list">
        {messages.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    ) : null
  );

  if (!body && !title) return null;

  return (
    <div className={`portal-form-notice portal-form-notice--${variant} ${className}`.trim()} role="alert">
      <Icon size={16} className="portal-form-notice-icon shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="portal-form-notice-title">{title}</p>}
        {body}
      </div>
    </div>
  );
}
