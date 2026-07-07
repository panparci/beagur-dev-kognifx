import React, { useState, useEffect, ChangeEvent, useMemo, useCallback } from 'react';
import { PortalShell } from '@core/ui/PortalShell';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { usePortalNav } from '@core/routing/usePortalNav';
import { teacherService } from '@modules/teachers/services/teacherService';
import { institutionService } from '@modules/institutions/services/institutionService';
import { AIService } from '@core/services/ai/AIService';
import { TeacherProfile, MonthlyReport, ApplicationStatus, Institution } from '@core/types';
import { applicationStatusVariant, applicationStatusLabel } from '@core/domain/applicationStatus';
import { EMPTY_TEACHER_PROFILE_DRAFT, TeacherProfileDraft, teacherProfileToDraft } from '@core/draft/draftTypes';
import { draftStorageKey, hasDirtyDraft } from '@core/draft/draftStorage';
import { findRegionByLabel, INDONESIA_REGIONS } from '@core/geo/indonesiaRegions';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { formatBankAccount } from '@core/utils/bank';
import { UploadCloud, History, Sparkles, BookOpen, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { TeacherPortalTutorial } from '../tutorial/TeacherPortalTutorial';
import { TeacherReportWizard } from './TeacherReportWizard';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import BusinessFlowBar from '@core/ui/BusinessFlowBar';
import { beaInput, beaSelect, beaTextarea, beaFieldLabel, beaFieldHint, beaSectionTitle, beaBody } from '@core/ui/beaTheme';
import { PortalModuleItem, PortalSectionHead, PortalStatChip } from '@core/ui/portal/PortalPrimitives';
import { useToast } from '@core/ui/toast/ToastProvider';
import { uploadService } from '@modules/funding/services/uploadService';

const TeacherDashboard: React.FC = () => {
  const user = useRequireUser();
  const { activeTab: currentActiveTab } = usePortalNav();

  // DB States
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  
  // App UI states
  const [isEditing, setIsEditing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [aiRewriting, setAiRewriting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState<'profilePhoto' | 'teachingPhoto' | null>(null);
  const toast = useToast();

  const {
    draft: profileDraft,
    patchDraft,
    resetFromServer,
    commitSuccess,
    discardDraft,
    isDirty: isProfileDraftDirty,
  } = useDraftState('teacher-profile', user.id, EMPTY_TEACHER_PROFILE_DRAFT);

  const updateProfileDraft = useCallback(
    (partial: Partial<TeacherProfileDraft>) => {
      setFormErrors([]);
      patchDraft(partial);
    },
    [patchDraft],
  );

  useUnsavedChangesGuard(isProfileDraftDirty);

  useEffect(() => {
    if (isProfileDraftDirty) {
      setIsEditing(true);
    }
  }, [isProfileDraftDirty]);

  const isOverview = currentActiveTab === OVERVIEW_TAB;
  const isProfileTab = isOverview || currentActiveTab === 'Pengajuan Profil';
  const isReportsTab = isOverview || currentActiveTab === 'Laporan Kelas Bulanan';
  const isTrainingTab = isOverview || currentActiveTab === 'Pelatihan Pedagogi';

  useEffect(() => {
    if (user) {
      loadTeacherProfileAndHistory();
    }
    loadInstitutions();
  }, [user]);

  const loadTeacherProfileAndHistory = async () => {
    if (!user) return;
    setPageLoading(true);
    try {
      const profileDraftKey = draftStorageKey(user.id, 'teacher-profile');
      const hasPendingDraft = hasDirtyDraft(profileDraftKey);

      const activeProfile = await teacherService.getProfileByUserId(user.id);
      setProfile(activeProfile);

      if (activeProfile) {
        resetFromServer(teacherProfileToDraft(activeProfile));
        setIsEditing(hasPendingDraft);
      } else {
        setIsEditing(true);
      }

      const reportList = await teacherService.getReportsByTeacher(user.id);
      setReports(Array.isArray(reportList) ? reportList : []);
    } catch {
      setReports([]);
      toast.error('Gagal memuat profil guru. Muat ulang halaman atau coba lagi.');
    } finally {
      setPageLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const list = await institutionService.getAllInstitutions();
      setInstitutions(Array.isArray(list) ? list : []);
    } catch {
      setInstitutions([]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'teachingPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = field === 'profilePhoto' ? 'teacher-profile' : 'teacher-teaching';
    setPhotoUploading(field);
    try {
      const url = await uploadService.uploadImage(kind, file);
      updateProfileDraft({ [field]: url });
      toast.success('Foto berhasil diunggah.', 'Unggah foto');
    } catch {
      toast.error('Gagal mengunggah foto. Gunakan JPG/PNG/WebP maks. 3MB.');
    } finally {
      setPhotoUploading(null);
      e.target.value = '';
    }
  };

  const handleAiRefineReason = async () => {
    const { jobTitle, yearsOfService, monthlySalary, reason } = profileDraft;
    if (!jobTitle || !yearsOfService || !monthlySalary || !(reason ?? '').trim() || !user) {
      toast.warning('Isi jabatan, lama mengabdi, gaji, dan draft alasan terlebih dahulu sebelum menjalankan AI.');
      return;
    }
    setAiRewriting(true);
    try {
      const refined = await AIService.assistWritingForm({
        userId: user.id,
        username: user.email,
        jobTitle,
        yearsOfService: Number(yearsOfService),
        monthlySalary: Number(monthlySalary),
        draftReason: reason,
      });
      updateProfileDraft({ reason: refined.text });
    } catch (e) {
      toast.error('Sistem AI mengalami hambatan jaringan. Silakan ulangi.');
    } finally {
      setAiRewriting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      fullName,
      instId,
      jobTitle,
      yearsOfService,
      monthlySalary,
      bankAccount,
      phoneNumber,
      region,
      reason,
      profilePhoto,
      teachingPhoto,
    } = profileDraft;

    const trimmedName = fullName.trim();
    const trimmedJob = jobTitle.trim();
    const trimmedBank = bankAccount.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedReason = (reason ?? '').trim();
    const trimmedRegion = region.trim();
    const years = Number(yearsOfService);
    const salary = Number(monthlySalary);

    if (!user) return;

    const missing: string[] = [];
    if (!trimmedName) missing.push('Nama lengkap');
    if (!instId) missing.push('Sekolah');
    if (!trimmedJob) missing.push('Jabatan');
    if (!Number.isFinite(years) || years < 0) missing.push('Lama mengabdi (min. 0 tahun)');
    if (!Number.isFinite(salary) || salary <= 0) missing.push('Gaji honorer (harus lebih dari 0)');
    if (!trimmedBank) missing.push('Rekening bank');
    if (!trimmedRegion) missing.push('Wilayah mengajar');
    if (!trimmedPhone) missing.push('No. telepon / WhatsApp');
    if (!trimmedReason) missing.push('Alasan pengajuan');

    const effectiveProfilePhoto = profilePhoto || profile?.photoUrl;
    const effectiveTeachingPhoto = teachingPhoto || profile?.teachingPhotoUrl;
    if (!effectiveProfilePhoto || !effectiveTeachingPhoto) {
      missing.push('Foto formal dan foto saat mengajar');
    } else if (
      effectiveProfilePhoto.startsWith('data:image') ||
      effectiveTeachingPhoto.startsWith('data:image')
    ) {
      missing.push('Unggah ulang foto (format lama tidak didukung)');
    }

    if (missing.length > 0) {
      setFormErrors(missing.map((f) => `${f} wajib diisi.`));
      toast.warning('Lengkapi semua field wajib sebelum mengirim.');
      return;
    }

    setFormErrors([]);

    const regionMeta = findRegionByLabel(trimmedRegion);

    const payload: TeacherProfile = {
      userId: user.id,
      fullName: trimmedName,
      institutionId: instId,
      jobTitle: trimmedJob,
      yearsOfService: years,
      monthlySalary: salary,
      bankAccountNumber: trimmedBank,
      phoneNumber: trimmedPhone,
      region: regionMeta?.label ?? trimmedRegion,
      latitude: regionMeta?.latitude,
      longitude: regionMeta?.longitude,
      reason: trimmedReason,
      photoUrl: effectiveProfilePhoto!,
      teachingPhotoUrl: effectiveTeachingPhoto!,
      status: ApplicationStatus.PENDING_VALIDATION,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };

    if (profile?.id) {
      payload.id = profile.id;
    }

    try {
      const saved = await teacherService.submitProfile(payload);
      setProfile(saved);
      commitSuccess();
      resetFromServer(teacherProfileToDraft(saved), { force: true });
      setIsEditing(false);
      toast.success(
        'Profil disimpan dan diajukan ke Kepala Sekolah untuk divalidasi.',
        'Pengajuan terkirim',
      );
    } catch {
      toast.error('Terjadi kendala saat menyimpan profil. Coba lagi.');
    }
  };

  const eduMaterials = [
    { title: 'Teknik Mengajar Kreatif Gizi Anak Terpadu', desc: 'Cara efektif mengintegrasikan edukasi kesehatan ke dalam materi ajar harian.' },
    { title: 'Manajemen Kelas Tanpa Fasilitas Mewah', desc: 'Inovasi belajar mengajar menggunakan bahan daur ulang dan media lingkungan.' },
    { title: 'Pedoman Pembuatan Laporan Dampak Publik', desc: 'Tips bercerita yang baik demi memertahankan donatur asuh tetap bertahan.' },
  ];

  const reportRows = useMemo(() => (Array.isArray(reports) ? reports : []), [reports]);
  const schoolList = useMemo(() => (Array.isArray(institutions) ? institutions : []), [institutions]);

  const handleCancelEdit = () => {
    discardDraft(teacherProfileToDraft(profile));
    setIsEditing(false);
  };

  const renderBadgeValue = (status?: ApplicationStatus) => (
    <Badge variant={applicationStatusVariant(status)}>
      {applicationStatusLabel(status, { perspective: 'teacher' })}
    </Badge>
  );

  const reportStatusLabel = (status: string) => {
    if (status === 'APPROVED') return 'Disetujui';
    if (status === 'PENDING') return 'Menunggu review';
    if (status === 'REJECTED') return 'Ditolak';
    return status;
  };

  return (
    <PortalShell title="Portal Guru Honorer">
      <TeacherPortalTutorial pageLoading={pageLoading} />

      {pageLoading && (
        <div className="portal-banner portal-banner--loading" role="status" aria-live="polite">
          <Loader2 size={16} className="animate-spin inline mr-2" aria-hidden />
          Memuat profil guru…
        </div>
      )}

      <DraftStatusBanner
        isDirty={isProfileDraftDirty}
        label="Draft profil tersimpan — lanjutkan mengisi kapan saja sebelum mengajukan."
        action={
          !isEditing
            ? { label: 'Lanjutkan mengisi', onClick: () => setIsEditing(true) }
            : undefined
        }
      />

      <TeacherReportWizard
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        userId={user.id}
        userEmail={user.email}
        onSubmitSuccess={() => {
          setIsReportOpen(false);
          loadTeacherProfileAndHistory();
        }}
        submitMonthlyReport={teacherService.submitMonthlyReport}
      />

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-3 text-sm">
        <div className={`space-y-2 ${isProfileTab ? 'block' : 'hidden'} ${isOverview ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <BusinessFlowBar variant="teacher" status={profile?.status} />
          {pageLoading ? null : profile && !isEditing ? (
            <Card>
              <div className="portal-profile-hero">
                <img 
                  src={profile.photoUrl} 
                  alt={profile.fullName} 
                  className="portal-profile-photo" 
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl font-semibold text-bea-ink md:text-2xl">{profile.fullName}</h2>
                    {renderBadgeValue(profile.status)}
                  </div>
                  <p className="mt-1 text-sm font-medium text-bea-sage">
                    {profile.jobTitle} · {schoolList.find(i => i.id === profile.institutionId)?.name || 'Sekolah Terdaftar'}
                  </p>
                  {profile.region && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-bea-copper">
                      <MapPin size={13} aria-hidden />
                      {profile.region}
                    </p>
                  )}
                  
                  <div className="portal-profile-meta">
                    <PortalStatChip label="Pengabdian" value={`${profile.yearsOfService} tahun`} />
                    <PortalStatChip label="Gaji honorer" value={`Rp ${profile.monthlySalary.toLocaleString('id-ID')}`} />
                    <PortalStatChip label="Rekening" value={formatBankAccount(profile.bankName, profile.bankAccountNumber)} />
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-bea-line pt-3">
                <h3 className="text-sm font-semibold text-bea-ink">Motivasi & cerita pengabdian</h3>
                <p className="portal-quote">
                  "{profile.reason ?? ''}"
                </p>
                
                {profile.status !== ApplicationStatus.APPROVED && (
                  <div className="portal-form-notice portal-form-notice--warning mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 font-medium leading-relaxed m-0">
                      <AlertCircle size={15} aria-hidden />
                      Profil sedang dalam moderasi. Anda masih bisa memperbarui data.
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Ubah Data</Button>
                  </div>
                )}
              </div>
            </Card>
          ) : pageLoading ? null : (
            // REGISTRATION / EDIT PROFILE FORM
            <Card>
              <PortalSectionHead
                title="Pengajuan Profil Guru"
                description="Lengkapi berkas pendaftaran. Kepala sekolah akan memverifikasi data honorer Anda."
              />
              <form onSubmit={handleProfileSubmit} className="mt-3 space-y-3" noValidate>
                {formErrors.length > 0 && (
                  <FormNotice variant="error" title="Periksa isian berikut" messages={formErrors} />
                )}
                <div className="portal-form-grid">
                  <div>
                    <label htmlFor="teacher-full-name" className={beaFieldLabel}>Nama Lengkap Guru (Sesuai KTP)</label>
                    <input 
                      id="teacher-full-name"
                      type="text" 
                      required
                      value={profileDraft.fullName}
                      onChange={(e) => updateProfileDraft({ fullName: e.target.value })}
                      className={beaInput}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-institution" className={beaFieldLabel}>Sekolah Tempat Mengajar</label>
                    <select
                      id="teacher-institution"
                      required
                      value={profileDraft.instId}
                      onChange={(e) => updateProfileDraft({ instId: e.target.value })}
                      className={beaSelect}
                    >
                      <option value="" disabled>Pilih sekolah terdaftar...</option>
                      {schoolList.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="teacher-job-title" className={beaFieldLabel}>Jabatan Fungsional</label>
                    <input 
                      id="teacher-job-title"
                      type="text" 
                      required
                      value={profileDraft.jobTitle}
                      onChange={(e) => updateProfileDraft({ jobTitle: e.target.value })}
                      placeholder="cth: Guru Honorer Agama, Guru Sukarelawan IPS"
                      className={beaInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-years" className={beaFieldLabel}>Lama Mengabdi (Dalam Tahun)</label>
                    <input 
                      id="teacher-years"
                      type="number" 
                      required
                      min={0}
                      value={profileDraft.yearsOfService}
                      onChange={(e) => updateProfileDraft({ yearsOfService: Number(e.target.value) })}
                      className={beaInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-salary" className={beaFieldLabel}>Gaji Bersih per Bulan (Rp)</label>
                    <input 
                      id="teacher-salary"
                      type="number" 
                      required
                      min={1}
                      value={profileDraft.monthlySalary}
                      onChange={(e) => updateProfileDraft({ monthlySalary: Number(e.target.value) })}
                      placeholder="cth: 500000"
                      className={beaInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-bank" className={beaFieldLabel}>No. Rekening Penyaluran (Format: Bank - NoRek)</label>
                    <input 
                      id="teacher-bank"
                      type="text" 
                      required
                      value={profileDraft.bankAccount}
                      onChange={(e) => updateProfileDraft({ bankAccount: e.target.value })}
                      placeholder="cth: Bank Mandiri - 1234567890"
                      className={beaInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-region" className={beaFieldLabel}>Wilayah Mengajar</label>
                    <select
                      id="teacher-region"
                      required
                      value={profileDraft.region}
                      onChange={(e) => updateProfileDraft({ region: e.target.value })}
                      className={beaSelect}
                    >
                      <option value="" disabled>Pilih kota/kabupaten tempat mengajar...</option>
                      {INDONESIA_REGIONS.map((item) => (
                        <option key={item.label} value={item.label}>{item.label}</option>
                      ))}
                    </select>
                    <p className={beaFieldHint}>
                      Lokasi ini ditampilkan di peta landing page (tingkat kabupaten/kota, bukan alamat rumah).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="teacher-phone" className={beaFieldLabel}>No. Telepon / WhatsApp Aktif</label>
                    <input 
                      id="teacher-phone"
                      type="tel" 
                      required
                      value={profileDraft.phoneNumber}
                      onChange={(e) => updateProfileDraft({ phoneNumber: e.target.value })}
                      placeholder="cth: 0812345678"
                      className={beaInput}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="portal-form-grid pt-2">
                  <div>
                    <label htmlFor="teacher-photo-formal" className={beaFieldLabel}>Foto Formal Diri</label>
                    <input 
                      id="teacher-photo-formal"
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      disabled={photoUploading === 'profilePhoto'}
                      onChange={(e) => void handleFileChange(e, 'profilePhoto')}
                      className="portal-file-input"
                    />
                    {photoUploading === 'profilePhoto' && (
                      <p className="text-[10px] text-bea-sage-muted mt-1">Mengunggah…</p>
                    )}
                    {profileDraft.profilePhoto && <img src={profileDraft.profilePhoto} alt="Pratinjau foto formal" className="mt-2 h-20 w-20 rounded-lg object-cover border border-bea-line" />}
                  </div>
                  <div>
                    <label htmlFor="teacher-photo-teaching" className={beaFieldLabel}>Foto Saat Sedang Mengajar</label>
                    <input 
                      id="teacher-photo-teaching"
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      disabled={photoUploading === 'teachingPhoto'}
                      onChange={(e) => void handleFileChange(e, 'teachingPhoto')}
                      className="portal-file-input"
                    />
                    {photoUploading === 'teachingPhoto' && (
                      <p className="text-[10px] text-bea-sage-muted mt-1">Mengunggah…</p>
                    )}
                    {profileDraft.teachingPhoto && <img src={profileDraft.teachingPhoto} alt="Pratinjau foto mengajar" className="mt-2 h-20 w-32 rounded-lg object-cover border border-bea-line" />}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="teacher-reason" className={beaFieldLabel}>Alasan Pengajuan & Cerita Dedikasi Anda</label>
                    <button
                      type="button"
                      disabled={aiRewriting}
                      onClick={handleAiRefineReason}
                      className="portal-ai-chip"
                    >
                      <Sparkles size={11} className={`${aiRewriting ? 'animate-spin' : 'animate-pulse text-amber-500'}`} />
                      {aiRewriting ? 'Mengasah Kalimat dengan AI...' : 'Keajaiban AI: Sempurnakan Cerita saya'}
                    </button>
                  </div>
                  <textarea 
                    id="teacher-reason"
                    rows={5} 
                    required
                    value={profileDraft.reason ?? ''}
                    onChange={(e) => updateProfileDraft({ reason: e.target.value })}
                    placeholder="Ceritakan tentang kesulitan Anda, dedikasi yang Anda kerjakan, dan dampak bantuan ini bagi pengembangan belajar mengajar murid..."
                    className={beaTextarea}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-bea-line">
                  {profile && (
                    <Button type="button" variant="secondary" onClick={handleCancelEdit}>Batal</Button>
                  )}
                  <Button type="submit">Unggah & Ajukan Verifikasi</Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div className={`space-y-4 ${isOverview ? 'block' : 'hidden lg:hidden'} lg:col-span-1`}>
          {isReportsTab && (
            <div className={isOverview ? 'block' : 'hidden'}>
              <Card variant="soft">
                <PortalSectionHead title="Laporan bulanan" description="Unggah dokumentasi mengajar untuk donatur." />
                <Button
                  onClick={() => setIsReportOpen(true)}
                  disabled={!profile || profile.status !== ApplicationStatus.APPROVED}
                  className="mt-3 w-full"
                  size="sm"
                >
                  <UploadCloud size={16} className="mr-2" />
                  Upload laporan
                </Button>
                {reportRows.length > 0 && (
                  <p className="mt-2 text-xs text-bea-sage-muted">{reportRows.length} laporan tercatat</p>
                )}
              </Card>
            </div>
          )}

          {isTrainingTab && (
            <div className={isOverview ? 'block' : 'hidden'}>
              <Card variant="soft">
                <PortalSectionHead title="Pelatihan" description="Modul pendampingan guru." />
                <ul className="mt-3 space-y-2">
                  {eduMaterials.slice(0, 2).map((mat) => (
                    <li key={mat.title} className="border-l-2 border-bea-copper pl-2.5 text-xs leading-snug text-bea-sage">
                      {mat.title}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>

        <div className={`${isReportsTab && !isOverview ? 'block' : 'hidden'} lg:col-span-3`}>
            <Card>
              <PortalSectionHead
                title="Laporan & testimoni kelas"
                description="Dokumentasi aktivitas mengajar bulanan untuk transparansi donatur."
                icon={History}
              />
              <div className="mt-4">
                <Button 
                  onClick={() => setIsReportOpen(true)} 
                  disabled={!profile || profile.status !== ApplicationStatus.APPROVED} 
                  className="w-full"
                >
                  <UploadCloud size={16} className="mr-2" />
                  Upload laporan bulanan
                </Button>
              </div>

              <div className="mt-5 border-t border-bea-line pt-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-bea-sage">
                  <History size={14} />
                  Riwayat unggahan
                </h3>
                {reportRows.length > 0 ? (
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {reportRows.map((rep) => (
                      <div key={rep.id} className="portal-list-item !py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-bea-ink">
                              {new Date(rep.submittedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </span>
                            <Badge variant={rep.status === 'APPROVED' ? 'success' : 'warning'}>
                              {reportStatusLabel(rep.status)}
                            </Badge>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-bea-sage">{rep.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-bea-sage-muted">Belum ada laporan bulanan.</p>
                )}
              </div>
            </Card>
        </div>

        <div className={`${isTrainingTab && !isOverview ? 'block' : 'hidden'} lg:col-span-3`}>
            <Card>
              <PortalSectionHead
                title="Materi pendampingan guru"
                description="Modul pelatihan hasil kerjasama pakar pedagogi Bea Guru."
                icon={BookOpen}
              />
              <div className="portal-module-grid mt-4">
                {eduMaterials.map((mat) => (
                  <PortalModuleItem
                    key={mat.title}
                    title={mat.title}
                    description={mat.desc}
                    icon={BookOpen}
                    meta="Modul terbuka"
                  />
                ))}
              </div>
            </Card>
        </div>
      </div>
    </PortalShell>
  );
};

export default TeacherDashboard;
