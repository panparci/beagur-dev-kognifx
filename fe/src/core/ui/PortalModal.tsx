import React from 'react';
import { X } from 'lucide-react';
import { ModalBackdrop } from './ModalBackdrop';

type PortalModalProps = {
  id?: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

export function PortalModal({ id, title, onClose, children, footer, size = 'md' }: PortalModalProps) {
  const sizeClass =
    size === 'xl' ? 'portal-modal--xl' : size === 'lg' ? 'portal-modal--lg' : '';

  return (
    <ModalBackdrop id={id}>
      <div className={`portal-modal ${sizeClass}`.trim()} role="document">
        <div className="portal-modal-accent" aria-hidden />
        <div className="portal-modal-head">
          <h2 className="portal-modal-title">{title}</h2>
          <button type="button" onClick={onClose} className="portal-modal-close" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="portal-modal-body">{children}</div>
        {footer ? <div className="portal-modal-foot">{footer}</div> : null}
      </div>
    </ModalBackdrop>
  );
}
