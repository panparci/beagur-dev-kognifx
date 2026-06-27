import React from 'react';

type ModalBackdropProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
};

export function ModalBackdrop({ id, children, className = '' }: ModalBackdropProps) {
  return (
    <div
      id={id}
      className={`portal-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-sm select-none ${className}`.trim()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
