import React, { useState, ChangeEvent, useMemo, useRef, useEffect, useCallback } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { AIService } from '@core/services/ai/AIService';
import { MonthlyReport } from '@core/types';
import { EMPTY_MONTHLY_REPORT_DRAFT } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { useToast } from '@core/ui/toast/ToastProvider';
import { 
  Sparkles, 
  UploadCloud, 
  Check, 
  CheckCircle2, 
  BookOpen, 
  Heart, 
  Smile, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface TeacherReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSubmitSuccess: () => void;
  submitMonthlyReport: (report: MonthlyReport) => Promise<MonthlyReport>;
}

export const TeacherReportWizard: React.FC<TeacherReportWizardProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSubmitSuccess,
  submitMonthlyReport
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const toast = useToast();
  const composeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    draft,
    patchDraft,
    commitSuccess,
    discardDraft,
    isDirty,
  } = useDraftState('teacher-monthly-report', userId, EMPTY_MONTHLY_REPORT_DRAFT);

  useUnsavedChangesGuard(isDirty && isOpen);

  useEffect(() => {
    return () => {
      if (composeIntervalRef.current) {
        clearInterval(composeIntervalRef.current);
      }
    };
  }, []);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Draft laporan belum dikirim. Tutup wizard dan buang perubahan?',
      );
      if (!confirmed) return;
      discardDraft({ ...EMPTY_MONTHLY_REPORT_DRAFT });
    }
    onClose();
  }, [discardDraft, isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleRequestClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleRequestClose, isOpen, loading]);

  const { step, reportPhoto, subject, studentProgress, supportBenefit, reportDesc } = draft;

  const presetPhotos = useMemo(
    () => [
      { name: 'Belajar Menulis', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600' },
      { name: 'Membaca Buku', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600' },
      { name: 'Siswa Bahagia', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600' },
    ],
    [],
  );

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      setLoadingMessage('Sedang membaca foto Anda...');
      const reader = new FileReader();
      reader.onloadend = () => {
        patchDraft({ reportPhoto: reader.result as string });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChoosePreset = (url: string) => {
    patchDraft({ reportPhoto: url });
  };

  const handleComposeWithAi = async () => {
    if (!subject.trim() || !studentProgress.trim() || !supportBenefit.trim()) {
      toast.warning('Isi ketiga pertanyaan bimbingan terlebih dahulu.');
      return;
    }

    setLoading(true);
    const messages = [
      'Menghubungkan ke Asisten Kecerdasan Buatan...',
      'Membaca jawaban tulus Bapak/Ibu Guru...',
      'Merapikan tanda baca dan ejaan bahasa Indonesia...',
      'Menghayati dedikasi pengajaran dalam bait kata...',
      'Menyusun kalimat ungkapan terima kasih yang istimewa untuk Donatur...'
    ];

    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    if (composeIntervalRef.current) clearInterval(composeIntervalRef.current);
    composeIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 1500);

    try {
      const result = await AIService.assistWritingReport({
        userId,
        username: userEmail,
        subject,
        studentProgress,
        supportBenefit
      });
      patchDraft({ reportDesc: result.text, step: 3 });
    } catch {
      const manualText = `Bulan ini saya mengajarkan tentang "${subject}". Siswa-siswi di kelas merespons dengan "${studentProgress}". Bantuan donasi sangat menolong kami terutama untuk "${supportBenefit}". Terima kasih banyak para donatur Bea Guru.`;
      patchDraft({ reportDesc: manualText, step: 3 });
    } finally {
      if (composeIntervalRef.current) {
        clearInterval(composeIntervalRef.current);
        composeIntervalRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reportDesc.trim()) {
      toast.warning('Catatan deskripsi laporan tidak boleh kosong.');
      return;
    }
    if (!reportPhoto?.trim()) {
      toast.warning('Unggah atau pilih foto kegiatan mengajar terlebih dahulu.');
      patchDraft({ step: 1 });
      return;
    }

    setLoading(true);
    setLoadingMessage('Mengirim berkas laporan ke sistem Bea Guru...');
    try {
      const payload: MonthlyReport = {
        teacherUserId: userId,
        photoUrl: reportPhoto,
        description: reportDesc.trim(),
        submittedAt: new Date().toISOString(),
        status: 'PENDING'
      };

      await submitMonthlyReport(payload);
      setLoading(false);
      commitSuccess();
      discardDraft({ ...EMPTY_MONTHLY_REPORT_DRAFT });
      onSubmitSuccess();
    } catch (err) {
      toast.error('Terjadi kendala saat mengirim laporan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-bea-ink/80 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-fade-in text-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-report-wizard-title"
    >
      <Card className="w-full max-w-2xl border-2 border-bea-line p-0 overflow-hidden shadow-2xl bg-white text-bea-ink flex flex-col my-4">
        
        {/* Header - Warm design welcoming the teacher */}
        <div className="bg-bea-copper p-5 text-white flex justify-between items-center relative">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-bea-copper/50 px-2 py-0.5 rounded-md">Bimbingan Laporan</span>
              <Badge variant="warning" className="text-[9px] px-1.5 py-0">Sangat Mudah & Praktis</Badge>
            </div>
            <h2 id="teacher-report-wizard-title" className="text-lg font-bold font-serif flex items-center gap-2">
              <BookOpen size={20} className="text-amber-300" />
              Tuntunan Laporan Bulanan Guru Asuh
            </h2>
            <p className="text-bea-copper-soft text-xs font-sans">
              Bapak/Ibu cukup ikuti langkah sederhana ini untuk menyapa Kakak Asuh (Donatur) Anda.
            </p>
          </div>
          <button 
            type="button"
            id="close-wizard-btn"
            onClick={handleRequestClose} 
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup wizard laporan"
          >
            &times;
          </button>
        </div>

        <DraftStatusBanner isDirty={isDirty} label="Draft laporan tersimpan — lanjutkan kapan saja sebelum kirim ke sistem." />

        {/* Step Guide Bar */}
        <div className="bg-bea-ivory-light border-b border-bea-line/60 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5 md:gap-8 mx-auto font-semibold">
            <span className={`flex items-center gap-1.5 pb-1 ${step === 1 ? 'border-b-2 border-bea-copper text-bea-copper font-extrabold' : 'text-bea-sage-muted'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-bea-copper text-white' : 'bg-bea-ivory text-bea-sage-muted'}`}>1</span>
              Foto Kelas
            </span>
            <span className="text-bea-line">&bull;&bull;</span>
            <span className={`flex items-center gap-1.5 pb-1 ${step === 2 ? 'border-b-2 border-bea-copper text-bea-copper font-extrabold' : 'text-bea-sage-muted'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-bea-copper text-white' : 'bg-bea-ivory text-bea-sage-muted'}`}>2</span>
              Cerita Mengajar (AI)
            </span>
            <span className="text-bea-line">&bull;&bull;</span>
            <span className={`flex items-center gap-1.5 pb-1 ${step === 3 ? 'border-b-2 border-bea-copper text-bea-copper font-extrabold' : 'text-bea-sage-muted'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-bea-copper text-white' : 'bg-bea-ivory text-bea-sage-muted'}`}>3</span>
              Kirim Laporan
            </span>
          </div>
        </div>

        {/* Loading Spinner Interface */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-bea-line border-t-bea-copper animate-spin" />
              <Sparkles className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-bea-ink">{loadingMessage}</p>
              <p className="text-xs text-bea-sage-muted">Mohon tunggu sebentar, kami sedang menjaga semuanya tetap mudah...</p>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            
            {/* STEP 1: UPLOAD PHOTO */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-bea-ivory-light border border-bea-line p-4 rounded-xl flex items-start gap-3.5">
                  <div className="p-2 bg-bea-copper/10 text-bea-copper rounded-lg">
                    <ImageIcon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-bea-copper-dark text-sm">Langkah 1: Masukkan Foto Kegiatan Belajar Mengajar</h4>
                    <p className="text-xs text-bea-copper-dark/80 leading-relaxed">
                      Satu foto penuh senyuman siswa mengajar akan membuat para donatur terus menyukuri niat baik mereka dalam berkontribusi.
                    </p>
                  </div>
                </div>

                {/* Big Drag and drop upload helper */}
                <div className="flex flex-col items-center justify-center border-3 border-dashed border-bea-line rounded-xl p-8 hover:bg-bea-ivory-light transition-all cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <UploadCloud size={48} className="text-bea-sage-muted group-hover:text-bea-copper transition-colors mb-3" />
                  <span className="font-extrabold text-bea-sage text-sm">Klik di sini untuk Memilih Foto Kelas</span>
                  <span className="text-[11px] text-bea-sage-muted mt-1">Mendukung kamera HP langsung atau file galeri gambar</span>
                </div>

                {/* Foto Terpilih Preview */}
                {reportPhoto && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-bea-sage-muted block uppercase">Pratinjau Foto Anda:</span>
                    <div className="relative rounded-xl overflow-hidden border">
                      <img src={reportPhoto} alt="Review Kelas" className="h-48 w-full object-cover" />
                      <button 
                        onClick={() => patchDraft({ reportPhoto: '' })}
                        className="absolute right-3 top-3 bg-red-650 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-bold"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                )}

                {/* Preset Photos Option for offline or older users */}
                <div className="pt-2">
                  <span className="text-xs font-extrabold text-bea-sage-muted block mb-2.5 uppercase tracking-wider">
                    💡 Atau Pilih Foto Kegiatan Contoh jika tidak ada foto sekarang:
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {presetPhotos.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleChoosePreset(p.url)}
                        aria-pressed={reportPhoto === p.url}
                        className={`border rounded-lg p-1.5 cursor-pointer transition-all text-left ${
                          reportPhoto === p.url 
                            ? 'border-bea-copper ring-2 ring-bea-copper/20 bg-bea-ivory-light/50' 
                            : 'border-bea-line hover:border-bea-line bg-bea-ivory-light/50'
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="h-16 w-full object-cover rounded" />
                        <span className="text-[10px] font-bold text-center block mt-1.5 truncate text-bea-sage">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    type="button"
                    onClick={() => {
                      if (!reportPhoto?.trim()) {
                        toast.warning('Pilih atau unggah foto kegiatan mengajar terlebih dahulu.');
                        return;
                      }
                      patchDraft({ step: 2 });
                    }}
                    className="bg-bea-copper hover:bg-bea-copper-dark max-w-xs text-white gap-2 font-bold py-3 px-6"
                  >
                    Lanjutkan ke Cerita Laporan 
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: GUIDED QUESTIONS WITH AI WRITER */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-amber-50/60 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3.5">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-amber-900 text-sm">Langkah 2: Tuliskan Cerita Kelas Anda dengan Bimbingan AI</h4>
                    <p className="text-xs text-bea-sage leading-relaxed">
                      Bapak/Ibu kesulitan merangkai teks bahasa Indonesia yang formal? 
                      Cukup ketik jawaban pendek dari 3 pertanyaan bimbingan berikut, lalu tekan tombol **Sempurnakan dengan AI**!
                    </p>
                  </div>
                </div>

                {/* Question 1 */}
                <div className="space-y-1">
                  <label className="block font-black text-bea-ink text-xs">
                    1. Apa saja materi pelajaran yang Bapak/Ibu ajarkan bulan ini? <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => patchDraft({ subject: e.target.value })}
                    placeholder="Contoh: Belajar berhitung matematika kelas 3 dasar dan menggambar pola flora"
                    className="w-full p-3 bg-bea-ivory-light border rounded-lg focus:ring-1 focus:ring-bea-copper/40 text-xs"
                  />
                </div>

                {/* Question 2 */}
                <div className="space-y-1">
                  <label className="block font-black text-bea-ink text-xs">
                    2. Bagaimana antusiasme perkataan atau keceriaan rasa murid-murid Anda? <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={studentProgress}
                    onChange={(e) => patchDraft({ studentProgress: e.target.value })}
                    placeholder="Contoh: Anak-anak aktif bernyanyi, mengulangi perkataan guru dengan tertib, senyum ceria"
                    className="w-full p-3 bg-bea-ivory-light border rounded-lg focus:ring-1 focus:ring-bea-copper/40 text-xs"
                  />
                </div>

                {/* Question 3 */}
                <div className="space-y-1">
                  <label className="block font-black text-bea-ink text-xs">
                    3. Sebutkan barang atau kebutuhan kelas yang terbantu dari dana donatur? <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={supportBenefit}
                    onChange={(e) => patchDraft({ supportBenefit: e.target.value })}
                    placeholder="Contoh: Membeli buku paket tulis, pensil warna baru, dan tambahan ongkos transportasi saya mengajar"
                    className="w-full p-3 bg-bea-ivory-light border rounded-lg focus:ring-1 focus:ring-bea-copper/40 text-xs"
                  />
                </div>

                {/* Trigger AI merger */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleComposeWithAi}
                    className="w-full bg-bea-copper hover:bg-bea-copper-dark text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                  >
                    <Sparkles className="animate-spin duration-1000" size={16} />
                    ✨ Sentuhan AI: Hubungkan & Rapikan Menjadi Laporan Indah
                  </button>
                </div>

                {/* Manual TextArea in case they don't want AI */}
                <div className="pt-3 border-t border-dashed mt-5">
                  <details className="cursor-pointer group">
                    <summary className="text-xs text-bea-sage-muted hover:text-bea-sage font-bold select-none list-none flex items-center gap-1">
                      <span>&rsaquo;</span> Bapak/Ibu ingin menulis laporan manual secara bebas langsung? Klik di sini
                    </summary>
                    <div className="mt-3 space-y-1.5 focus:outline-none">
                      <textarea 
                        rows={5}
                        value={reportDesc}
                        onChange={(e) => patchDraft({ reportDesc: e.target.value })}
                        placeholder="Ketik seluruh laporan mengajar bapak/ibu di sini dari awal..."
                        className="w-full p-3 bg-bea-ivory-light border rounded-lg focus:ring-1 focus:ring-bea-copper/40 text-xs leading-relaxed"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => {
                            if (reportDesc.trim()) patchDraft({ step: 3 });
                            else toast.warning('Masukkan isi laporan terlebih dahulu.');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4"
                        >
                          Tinjau Laporan manual Saya &rarr;
                        </Button>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-6">
                  <button 
                    onClick={() => patchDraft({ step: 1 })}
                    className="flex items-center gap-1 text-xs text-bea-sage font-bold hover:text-bea-ink"
                  >
                    <ArrowLeft size={14} /> Kembali ke Langkah Foto
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & PRINT MOCK PREVIEW (MOCK PAPER LETTER) */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-emerald-50/50 border border-emerald-250 p-4 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-bea-ink">Langkah Akhir: Tinjau Berkas Laporan Kinerja</h4>
                    <p className="text-xs text-bea-sage-muted mt-0.5">Berikut adalah hasil rancangan laporan yang akan dikirimkan kepada Donatur / Kakak Asuh program Bea Guru Anda.</p>
                  </div>
                </div>

                {/* Simulated Paper Report Layout - Intuitive Real world Metaphor */}
                <div className="bg-orange-50/25 border-4 border-double border-bea-line p-6 rounded-lg text-xs space-y-4 max-w-xl mx-auto shadow-inner relative overflow-hidden">
                  <div className="absolute right-4 top-4 rotate-12 select-none pointer-events-none opacity-20 border-4 border-red-650 border-double text-red-650 font-extrabold uppercase px-3 py-1 text-center tracking-widest text-[11px] rounded">
                    SIAP DIKIRIM
                  </div>

                  {/* Header of paper report */}
                  <div className="text-center border-b border-bea-line pb-3 space-y-1">
                    <h3 className="font-serif font-black text-bea-ink text-sm uppercase tracking-wide">LAPORAN BULANAN KEGIATAN MENGAJAR GURU ASUH</h3>
                    <p className="text-[10px] text-bea-sage-muted tracking-wider">Laporan Tanggung Jawab Sosial Penerima Manfaat Bea Guru Indonesia</p>
                    <p className="text-[9px] font-mono text-bea-copper-dark font-bold">Tanggal Kirim: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  {/* Attachment photo mockup */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-bea-sage-muted">Bukti Aktivitas:</span>
                      <img 
                        src={reportPhoto || presetPhotos[0].url} 
                        alt="Bukti" 
                        className="w-full h-24 object-cover rounded border border-bea-line shadow-sm" 
                      />
                    </div>
                    
                    {/* Content narrative */}
                    <div className="md:col-span-2 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-bea-sage-muted">Isi Laporan Pembelajaran:</span>
                      <p className="text-bea-sage italic leading-relaxed text-[11px]">
                        "{reportDesc}"
                      </p>
                    </div>
                  </div>

                  {/* Bottom stamp mockup */}
                  <div className="border-t border-bea-line pt-3 flex justify-between items-end">
                    <div className="text-[10px] text-emerald-650 font-bold flex items-center gap-1">
                      <Heart size={12} className="fill-current animate-pulse text-red-500" />
                      Peduli Guru Honorer Indonesia
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase block text-bea-sage-muted">Penerima Manfaat</span>
                      <span className="font-bold text-bea-ink italic">Bapak/Ibu Guru Asuh</span>
                    </div>
                  </div>
                </div>

                {/* Back and Confirm Trigger */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-3">
                  <button 
                    onClick={() => patchDraft({ step: 2 })}
                    className="flex items-center gap-1 text-xs text-bea-sage font-bold hover:text-bea-ink cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Kembali Edit Teks Laporan
                  </button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-6 uppercase tracking-wider flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center"
                  >
                    <CheckCircle2 size={16} /> Ya, Kirim Laporan Sekarang
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Informational Helpful Footer - soothing message */}
        <div className="bg-bea-ivory-light border-t border-bea-line/60 p-4 text-xs text-bea-sage-muted flex items-center gap-2 italic leading-relaxed justify-center">
          <AlertCircle size={15} className="text-bea-copper flex-shrink-0" />
          <span>Laporan yang dikirim akan otomatis diperiksa dan diperlihatkan ke dashboard Kakak Asuh penyokong Anda.</span>
        </div>

      </Card>
    </div>
  );
};
