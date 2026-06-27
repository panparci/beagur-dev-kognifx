import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function PortalPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`portal-page ${className}`.trim()}>{children}</div>;
}

export function PortalSectionHead({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="portal-section-head">
      <div>
        <h2 className="portal-section-title">
          {Icon && <Icon size={18} className="inline-block shrink-0 text-bea-copper mr-1.5" aria-hidden />}
          {title}
        </h2>
        {description && <p className="portal-section-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PortalModuleItem({
  title,
  description,
  icon: Icon,
  meta,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  meta?: string;
}) {
  return (
    <article className="portal-module-item">
      <div className="portal-module-icon" aria-hidden>
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="portal-module-body">
        <h3 className="portal-module-title">{title}</h3>
        <p className="portal-module-desc">{description}</p>
        {meta && <p className="portal-module-meta">{meta}</p>}
      </div>
    </article>
  );
}

export function PortalStatChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="portal-stat-chip">
      <span className="portal-stat-chip-label">{label}</span>
      <span className="portal-stat-chip-value">{value}</span>
    </div>
  );
}

export function PortalEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="portal-empty">
      {Icon && <Icon size={28} className="portal-empty-icon" aria-hidden />}
      <p className="portal-empty-title">{title}</p>
      {description && <p className="portal-empty-desc">{description}</p>}
    </div>
  );
}
