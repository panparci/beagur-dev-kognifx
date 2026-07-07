import React, { useEffect, useState } from 'react';
import Button from '@core/ui/Button';
import { FormNotice } from '@core/ui/FormNotice';
import { PortalModal } from '@core/ui/PortalModal';
import { DonorSummary } from '@core/types';
import { beaFieldLabel, beaInput } from '@core/ui/beaTheme';

interface ManageDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (donor: { id?: string; email: string; name: string; phone: string }) => void | Promise<void>;
  donor: DonorSummary | null;
}

export default function ManageDonorModal({ isOpen, onClose, onSave, donor }: ManageDonorModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail(donor?.email ?? '');
    setName(donor?.name ?? '');
    setPhone(donor?.phone ?? '');
    setFormError(null);
  }, [donor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setFormError('Nama dan email wajib diisi.');
      return;
    }
    setFormError(null);
    try {
      await onSave({ id: donor?.id, email: email.trim(), name: name.trim(), phone: phone.trim() });
      onClose();
    } catch {
      /* parent toast */
    }
  };

  return (
    <PortalModal
      id="donor-modal-backdrop"
      title={donor ? 'Edit Donatur' : 'Tambah Donatur'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button type="submit" form="donor-form">
            Simpan
          </Button>
        </>
      }
    >
      <form id="donor-form" onSubmit={handleSubmit} className="portal-form-stack">
        {formError && <FormNotice variant="error">{formError}</FormNotice>}
        <div>
          <label htmlFor="donor-name" className={beaFieldLabel}>
            Nama Donatur
          </label>
          <input id="donor-name" className={beaInput} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="donor-email" className={beaFieldLabel}>
            Email
          </label>
          <input
            id="donor-email"
            type="email"
            className={beaInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="donor-phone" className={beaFieldLabel}>
            Telepon
          </label>
          <input id="donor-phone" className={beaInput} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </form>
    </PortalModal>
  );
}
