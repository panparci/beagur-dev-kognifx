import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { ModalBackdrop } from '@core/ui/ModalBackdrop';
import { beaFieldLabel, beaInput } from '@core/ui/beaTheme';
import { DonationType } from '@core/types';
import { CheckCircle2, Download, Heart } from 'lucide-react';
import { DONATION_CHIPS } from '../hooks/useDonorDashboard';
import { useDonorDashboardContext } from '../context/DonorDashboardContext';

export function DonationModal() {
  const {
    isDonateOpen,
    setIsDonateOpen,
    isSuccessMsg,
    lastSubmittedInvoice,
    targetTeacher,
    donationDraft,
    patchDonation,
    isDonationDraftDirty,
    handleCustomDonation,
    proofFile,
    handleProofFileChange,
    isUploadingProof,
  } = useDonorDashboardContext();

  if (!isDonateOpen) return null;

  return (
    <ModalBackdrop id="donor-modal-backdrop">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-bea-line pb-3">
          <h2 className="portal-section-title text-base flex items-center gap-2">
            <Heart className="text-rose-500 animate-pulse w-5 h-5" />
            Salurkan Donasi Kebaikan
          </h2>
          <button
            type="button"
            onClick={() => setIsDonateOpen(false)}
            className="rounded-full p-1 text-bea-sage-muted hover:bg-bea-ivory"
            aria-label="Tutup"
          >
            <Download size={18} className="rotate-45" />
          </button>
        </div>

        {isSuccessMsg ? (
          <div className="text-center py-8 space-y-3 animate-scale-up">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
            <h3 className="font-bold text-base text-bea-ink">Donasi Terdaftar — Menunggu Verifikasi</h3>
            <p className="text-xs text-bea-sage leading-relaxed px-4">
              Terima kasih atas kontribusi Anda.
              {lastSubmittedInvoice ? (
                <>
                  {' '}
                  Nomor invoice: <strong className="font-mono text-bea-ink">{lastSubmittedInvoice}</strong>.
                </>
              ) : null}{' '}
              Tim yayasan memverifikasi bukti transfer sebelum donasi masuk ke ledger transparansi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCustomDonation} className="space-y-4">
            <DraftStatusBanner
              isDirty={isDonationDraftDirty}
              label="Nominal donasi tersimpan sebagai draft sampai Anda konfirmasi."
            />
            {targetTeacher && (
              <div className="portal-banner portal-banner--warn flex items-center gap-3 mb-1 animate-fade-in">
                <img
                  src={targetTeacher.photoUrl}
                  alt={targetTeacher.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="text-xs min-w-0">
                  <p className="font-bold">Memilih Guru Asuh:</p>
                  <p className="font-semibold text-bea-ink truncate">{targetTeacher.fullName}</p>
                  <p className="text-[10px] text-bea-sage-muted uppercase truncate">
                    {targetTeacher.jobTitle}
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className={beaFieldLabel}>Pilih Nominal Cepat</p>
              <div className="grid grid-cols-2 gap-2">
                {DONATION_CHIPS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => patchDonation({ amount: val })}
                    className={`ui-btn ui-btn--outline ui-btn--sm ${
                      donationDraft.amount === val
                        ? 'ring-2 ring-bea-copper/30 border-bea-copper text-bea-copper-dark'
                        : ''
                    }`}
                  >
                    Rp {val.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="custom-amt-input" className={beaFieldLabel}>
                Atau Nominal Kustom (Rp)
              </label>
              <input
                type="number"
                id="custom-amt-input"
                value={donationDraft.amount}
                onChange={(e) =>
                  patchDonation({ amount: e.target.value ? Number(e.target.value) : '' })
                }
                className={beaInput}
                placeholder="cth: 750000"
                required
              />
            </div>

            <div>
              <p className={beaFieldLabel}>Tipe Penyaluran Donasi</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={donationDraft.type === DonationType.RECURRING}
                    onChange={() => patchDonation({ type: DonationType.RECURRING })}
                    className="text-bea-copper focus:ring-bea-copper/40"
                  />
                  <span className="text-xs font-medium">Komitmen Bulanan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={donationDraft.type === DonationType.ONE_TIME}
                    onChange={() => patchDonation({ type: DonationType.ONE_TIME })}
                    className="text-bea-copper focus:ring-bea-copper/40"
                  />
                  <span className="text-xs font-medium">Sekali Waktu (Ad-Hoc)</span>
                </label>
              </div>
              {donationDraft.type === DonationType.RECURRING && (
                <p className="text-[10px] text-bea-sage-muted mt-2 leading-relaxed">
                  Komitmen bulanan: transfer manual setiap bulan + unggah bukti. Belum ada auto-debit.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="proof-file-input" className={beaFieldLabel}>
                Unggah Bukti Transfer (JPG/PNG/PDF, maks. 5MB)
              </label>
              <input
                type="file"
                id="proof-file-input"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => handleProofFileChange(e.target.files?.[0] ?? null)}
                className={beaInput}
                required
              />
              {proofFile && (
                <p className="text-[10px] text-bea-sage mt-1">File dipilih: {proofFile.name}</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsDonateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isUploadingProof}>
                {isUploadingProof ? 'Mengunggah...' : 'Konfirmasi Penyaluran'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </ModalBackdrop>
  );
}
