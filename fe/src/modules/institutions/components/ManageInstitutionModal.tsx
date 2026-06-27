import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@core/ui/Button';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { FormNotice } from '@core/ui/FormNotice';
import { PortalModal } from '@core/ui/PortalModal';
import { Institution, User } from '@core/types';
import { EMPTY_INSTITUTION_DRAFT, InstitutionDraft } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { beaFieldLabel, beaInput, beaSelect, beaTextarea } from '@core/ui/beaTheme';

interface ManageInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (institution: Institution) => void | Promise<void>;
  institution: Institution | null;
  validators: User[];
  userId?: string;
}

const ManageInstitutionModal: React.FC<ManageInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  institution,
  validators,
  userId,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const formKey = useMemo(
    () => `institution:${institution?.id ?? 'new'}`,
    [institution?.id],
  );

  const {
    draft,
    patchDraft,
    resetFromServer,
    commitSuccess,
    discardDraft,
    isDirty,
  } = useDraftState(formKey, userId, EMPTY_INSTITUTION_DRAFT);

  const updateDraft = useCallback(
    (partial: Partial<InstitutionDraft>) => {
      setFormError(null);
      patchDraft(partial);
    },
    [patchDraft],
  );

  useUnsavedChangesGuard(isDirty && isOpen);

  useEffect(() => {
    if (!isOpen) return;
    resetFromServer({
      name: institution?.name ?? '',
      address: institution?.address ?? '',
      validatorUserId: institution?.validatorUserId ?? '',
    });
  }, [institution, isOpen, resetFromServer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.address || !draft.validatorUserId) {
      setFormError('Semua data institusi wajib diisi lengkap.');
      return;
    }

    setFormError(null);

    try {
      await onSave({
        id: institution?.id || '',
        name: draft.name,
        address: draft.address,
        validatorUserId: draft.validatorUserId,
      });
      commitSuccess();
      onClose();
    } catch {
      /* parent shows error */
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleDiscard = () => {
    discardDraft({
      name: institution?.name ?? '',
      address: institution?.address ?? '',
      validatorUserId: institution?.validatorUserId ?? '',
    });
    setFormError(null);
    onClose();
  };

  return (
    <PortalModal
      id="school-modal-backdrop"
      title={institution ? 'Edit Institusi' : 'Tambah Institusi Baru'}
      onClose={handleClose}
      footer={
        <>
          {isDirty && (
            <Button type="button" variant="secondary" onClick={handleDiscard}>
              Buang draft
            </Button>
          )}
          <Button id="cancel-school-btn" type="button" variant="secondary" onClick={handleClose}>
            Tutup
          </Button>
          <Button id="save-school-btn" type="submit" form="school-institution-form">
            {institution ? 'Simpan Perubahan' : 'Salurkan & Daftarkan'}
          </Button>
        </>
      }
    >
      <DraftStatusBanner
        isDirty={isDirty}
        label="Draft institusi tersimpan — tutup modal kapan saja, isian tetap aman sampai disimpan."
      />

      <form id="school-institution-form" onSubmit={handleSubmit} className="portal-form-stack">
        {formError && <FormNotice variant="error">{formError}</FormNotice>}
        <div>
          <label htmlFor="school-name-input" className={beaFieldLabel}>
            Nama Institusi
          </label>
          <input
            type="text"
            id="school-name-input"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            className={beaInput}
            placeholder="cth: SDN 1 Harapan Bangsa"
            required
          />
        </div>
        <div>
          <label htmlFor="school-addr-input" className={beaFieldLabel}>
            Alamat Sekolah
          </label>
          <textarea
            id="school-addr-input"
            value={draft.address}
            onChange={(e) => updateDraft({ address: e.target.value })}
            rows={3}
            className={beaTextarea}
            placeholder="Detail alamat operasional lengkap..."
            required
          />
        </div>
        <div>
          <label htmlFor="school-validator-select" className={beaFieldLabel}>
            Tugas Kepala Sekolah (Validator)
          </label>
          <select
            id="school-validator-select"
            value={draft.validatorUserId}
            onChange={(e) => updateDraft({ validatorUserId: e.target.value })}
            className={beaSelect}
            required
          >
            <option value="" disabled>
              Pilih Kepala Sekolah sebagai penanggung jawab...
            </option>
            {validators.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.email})
              </option>
            ))}
          </select>
        </div>
      </form>
    </PortalModal>
  );
};

export default ManageInstitutionModal;
