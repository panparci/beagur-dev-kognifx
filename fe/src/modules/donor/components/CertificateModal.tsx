import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import { ModalBackdrop } from '@core/ui/ModalBackdrop';
import { Award, Printer } from 'lucide-react';
import { useDonorDashboardContext } from '../context/DonorDashboardContext';

export function CertificateModal() {
  const { isCertificateOpen, setIsCertificateOpen, user, philLevel, totalDonationAmount } =
    useDonorDashboardContext();

  if (!isCertificateOpen) return null;

  return (
    <ModalBackdrop className="bg-black/75">
      <Card className="w-full max-w-2xl border-8 border-double border-amber-600/60 p-8 sm:p-12 relative overflow-hidden bg-bea-ivory-light text-bea-ink shadow-2xl rounded-sm">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full border-4 border-dashed border-amber-650/30 flex items-center justify-center rotate-12 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full border-4 border-dashed border-amber-650/30 flex items-center justify-center -rotate-12 pointer-events-none" />

        <div className="text-center space-y-6 relative z-10 font-sans">
          <div className="flex justify-center mb-2">
            <Award className="text-amber-650 w-16 h-16 animate-pulse" />
          </div>
          <h3 className="font-serif text-amber-800 text-xs font-black tracking-[0.25em] uppercase">
            Sertifikat Penghargaan & Apresiasi
          </h3>
          <p className="text-[10px] text-bea-sage-muted font-serif tracking-widest uppercase">
            Yayasan Bea Guru Indonesia
          </p>

          <div className="py-4">
            <p className="text-bea-sage-muted italic text-xs">Apresiasi Tertinggi Kemanusiaan Ditujukan Kepada:</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-900 border-b-2 border-bea-line w-fit mx-auto px-6 py-2 mt-2">
              {user.name || 'Donatur Hebat'}
            </h2>
          </div>

          <p className="text-xs text-bea-sage leading-relaxed max-w-lg mx-auto italic leading-normal">
            &ldquo;Atas komitmen tulus, kepedulian yang mendalam, dan kontribusi keuangan yang luar biasa
            dalam mendukung kesejahteraan sosial para pendidik honorer di Nusantara. Kepedulian Anda
            adalah tiang cahaya masa depan anak-anak bangsa.&rdquo;
          </p>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-bea-line font-serif text-left">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-bea-sage-muted font-sans">Peringkat Kehormatan</p>
              <p className="font-bold text-bea-ink text-xs sm:text-sm mt-1">{philLevel.title}</p>
              <p className="text-[10px] text-bea-copper-dark font-bold font-sans mt-0.5">
                Kontribusi Terdaftar: Rp {totalDonationAmount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-16 h-16 rounded-full border-4 border-double border-amber-650 flex items-center justify-center text-amber-600 font-mono font-black text-[9px] select-none rotate-6 bg-white shadow-sm mr-2 mb-1.5 p-1 text-center">
                BEA GURU SEAL
              </div>
              <p className="text-[9px] uppercase tracking-wider text-bea-sage-muted font-sans">Direktorat Filantropi</p>
              <p className="font-bold text-bea-ink text-xs mt-1">Yayasan Bea Guru</p>
            </div>
          </div>

          <div className="pt-8 border-t border-bea-line flex justify-end gap-3 font-sans">
            <Button
              onClick={() => window.print()}
              variant="secondary"
              className="bg-white border-bea-line text-bea-ink flex items-center gap-1.5 text-xs font-semibold py-2 px-3 hover:bg-bea-ivory"
            >
              <Printer size={13} />
              Cetak Dokumen
            </Button>
            <Button
              onClick={() => setIsCertificateOpen(false)}
              className="bg-bea-ink hover:bg-bea-copper-dark text-white flex items-center gap-1 text-xs py-2 px-3 font-semibold"
            >
              Tutup Tampilan
            </Button>
          </div>
        </div>
      </Card>
    </ModalBackdrop>
  );
}
