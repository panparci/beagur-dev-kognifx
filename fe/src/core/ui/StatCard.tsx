import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
  tone?: 'default' | 'copper' | 'green' | 'amber' | 'rose';
}

export const StatGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`portal-kpi-grid ${className}`.trim()}>{children}</div>;

const StatCard: React.FC<StatCardProps> = ({ label, value, className = '', tone = 'default' }) => (
  <div className={`portal-kpi portal-kpi--${tone} ${className}`.trim()}>
    <span className="portal-kpi-value">{value}</span>
    <span className="portal-kpi-label">{label}</span>
  </div>
);

export default StatCard;
