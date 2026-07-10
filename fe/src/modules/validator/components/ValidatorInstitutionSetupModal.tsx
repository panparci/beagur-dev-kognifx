import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Loader2, School } from 'lucide-react';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';
import { beaFieldLabel, beaInput, beaTextarea } from '@core/ui/beaTheme';
import { validatorInstitutionService } from '../services/validatorInstitutionService';

type ValidatorInstitutionSetupModalProps = {
  onComplete: () => void;
};

export function ValidatorInstitutionSetupModal({ onComplete }: ValidatorInstitutionSetupModalProps) {
  const reduce = useReducedMotion();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      await validatorInstitutionService.setup(name, address);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data sekolah.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="choose-role-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validator-institution-title"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: PORTAL_FOG_EASE }}
    >
      <motion.div
        className="choose-role-panel validator-institution-panel"
        initial={reduce ? false : { opacity: 0, y: 28, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: PORTAL_FOG_EASE }}
      >
        <div className="choose-role-panel-inner">
          <span className="validator-institution-icon" aria-hidden>
            <School size={28} strokeWidth={1.75} />
          </span>
          <h2 id="validator-institution-title" className="choose-role-title">
            Lengkapi Data Sekolah
          </h2>
          <p className="choose-role-lead">
            Akun kepala sekolah Anda sudah disetujui. Isi data institusi sebelum membuka portal
            verifikasi guru honorer.
          </p>

          {error && (
            <div role="alert" className="portal-banner portal-banner--error choose-role-error">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="validator-institution-form">
            <div>
              <label htmlFor="validator-school-name" className={beaFieldLabel}>
                Nama Institusi
              </label>
              <input
                id="validator-school-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={beaInput}
                placeholder="cth: SDN 1 Harapan Bangsa"
                required
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="validator-school-address" className={beaFieldLabel}>
                Alamat Domisili
              </label>
              <textarea
                id="validator-school-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={beaTextarea}
                rows={3}
                placeholder="Alamat lengkap sekolah / domisili operasional..."
                required
              />
            </div>
            <button type="submit" disabled={loading} className="auth-submit-btn validator-institution-submit">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Menyimpan…
                </>
              ) : (
                'Simpan & Lanjut ke Portal'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
