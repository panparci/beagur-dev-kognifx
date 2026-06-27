import React, { useState, useEffect, useMemo } from 'react';
import { PortalShell } from '@core/ui/PortalShell';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { usePortalNav } from '@core/routing/usePortalNav';
import { teacherService } from '@modules/teachers/services/teacherService';
import { TeacherProfile, ApplicationStatus } from '@core/types';
import { X, CheckCircle, User, ShieldAlert, CheckSquare, History, Clock, ArrowRight, FileCheck } from 'lucide-react';
import { showTab } from '@core/ui/tabPanel';
import { OVERVIEW_TAB, VALIDATOR_HISTORY_TAB } from '@core/constants/tabs';
import { applicationStatusVariant, applicationStatusLabel } from '@core/domain/applicationStatus';
import { ModalBackdrop } from '@core/ui/ModalBackdrop';
import { useToast } from '@core/ui/toast/ToastProvider';

type TeacherItem = { profile: TeacherProfile; institutionName: string };
type HistoryFilter = 'all' | 'approved' | 'rejected' | 'pending_foundation';

const ValidatorDashboard: React.FC = () => {
  const user = useRequireUser();
  const { activeTab: currentActiveTab, setActiveTab } = usePortalNav();

  const [queue, setQueue] = useState<TeacherItem[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<TeacherItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TeacherItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const toast = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [pendingList, allAtSchool] = await Promise.all([
      teacherService.getPendingValidations(user.id),
      teacherService.getValidationHistory(user.id),
    ]);
    setQueue(pendingList);
    setSchoolTeachers(allAtSchool);
  };

  const handleDecision = async (profileId: string, approve: boolean) => {
    try {
      await teacherService.submitValidationDecision(profileId, approve);
      toast.success(`Berkas guru berhasil di-${approve ? 'setujui' : 'tolak'}.`, 'Validasi tersimpan');
      setSelectedItem(null);
      await loadData();
    } catch {
      toast.error('Gagal menyalurkan keputusan verifikasi.');
    }
  };

  const processedTeachers = useMemo(
    () => schoolTeachers.filter((item) => item.profile.status !== ApplicationStatus.PENDING_VALIDATION),
    [schoolTeachers],
  );

  const stats = useMemo(() => {
    const approvedByValidator = processedTeachers.filter(
      (i) => i.profile.status === ApplicationStatus.PENDING_APPROVAL,
    ).length;
    const acceptedFinal = processedTeachers.filter((i) => i.profile.status === ApplicationStatus.APPROVED).length;
    const rejected = processedTeachers.filter((i) => i.profile.status === ApplicationStatus.REJECTED).length;
    return {
      pending: queue.length,
      approvedByValidator,
      acceptedFinal,
      rejected,
      total: schoolTeachers.length,
    };
  }, [processedTeachers, queue.length, schoolTeachers.length]);

  const filteredQueue = queue.filter(
    (item) =>
      item.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.institutionName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredHistory = useMemo(() => {
    let items = processedTeachers.filter(
      (item) =>
        item.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institutionName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (historyFilter === 'approved') {
      items = items.filter((i) => i.profile.status === ApplicationStatus.APPROVED);
    } else if (historyFilter === 'rejected') {
      items = items.filter((i) => i.profile.status === ApplicationStatus.REJECTED);
    } else if (historyFilter === 'pending_foundation') {
      items = items.filter((i) => i.profile.status === ApplicationStatus.PENDING_APPROVAL);
    }
    return items;
  }, [processedTeachers, searchQuery, historyFilter]);

  const schoolsInScope = useMemo(() => {
    const names = new Set(schoolTeachers.map((i) => i.institutionName));
    return Array.from(names);
  }, [schoolTeachers]);

  return (
    <PortalShell title="Portal Kepala Sekolah (Validator)" onSearch={setSearchQuery}>
      {selectedItem && (
        <ModalBackdrop id="validator-dialog-backdrop">
          <Card className="w-full max-w-2xl border max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold font-serif text-bea-ink">
                Validasi Berkas: {selectedItem.profile.fullName}
              </h2>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded-full hover:bg-bea-ivory text-bea-sage-muted">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-bea-sage-muted font-bold uppercase tracking-widest text-[9px] mb-1.5">Foto Profil Resmi:</span>
                  <img src={selectedItem.profile.photoUrl} alt="Formal face" className="w-full h-auto max-h-48 rounded-lg object-cover border" />
                </div>
                <div>
                  <span className="block text-bea-sage-muted font-bold uppercase tracking-widest text-[9px] mb-1.5">Foto Fisik Mengajar di Kelas:</span>
                  <img src={selectedItem.profile.teachingPhotoUrl} alt="Class validation" className="w-full h-auto max-h-48 rounded-lg object-cover border" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2 bg-bea-ivory-light border rounded-lg text-center">
                  <p className="text-[9px] font-bold text-bea-sage-muted uppercase mb-0.5">Jabatan</p>
                  <p className="font-bold text-bea-ink font-serif">{selectedItem.profile.jobTitle}</p>
                </div>
                <div className="p-2 bg-bea-ivory-light border rounded-lg text-center">
                  <p className="text-[9px] font-bold text-bea-sage-muted uppercase mb-0.5">Lama Bakti</p>
                  <p className="font-bold text-bea-ink font-serif">{selectedItem.profile.yearsOfService} Tahun</p>
                </div>
                <div className="p-2 bg-bea-ivory-light border rounded-lg text-center">
                  <p className="text-[9px] font-bold text-bea-sage-muted uppercase mb-0.5">Gaji Sekolah</p>
                  <p className="font-bold text-bea-copper-dark font-serif">Rp {selectedItem.profile.monthlySalary.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-2 bg-bea-ivory-light border rounded-lg text-center">
                  <p className="text-[9px] font-bold text-bea-sage-muted uppercase mb-0.5">Nomer Rekening</p>
                  <p className="font-bold text-bea-ink truncate block" title={selectedItem.profile.bankAccountNumber}>{selectedItem.profile.bankAccountNumber}</p>
                </div>
              </div>

              <div className="p-3.5 bg-bea-ivory-light/50 border rounded-lg">
                <h4 className="font-bold text-xs uppercase tracking-wider text-bea-sage-muted mb-1.5">Alasan Pengajuan & Narasi Perjuangan:</h4>
                <p className="text-bea-sage italic leading-relaxed">
                  "{selectedItem.profile.reason}"
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/40 rounded-lg text-[11px] text-amber-800 leading-relaxed flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" />
                <span><strong>SOP Validator:</strong> Sebagai kepala sekolah, penekanan persetujuan Anda menyatakan bahwa nominal upah honorer and kebenaran data formal guru di atas adalah valid sesuai catatan sekolah.</span>
              </div>
            </div>

            {selectedItem.profile.status === ApplicationStatus.PENDING_VALIDATION && (
              <div className="flex justify-end pt-5 border-t gap-2.5">
                <Button variant="danger" onClick={() => handleDecision(selectedItem.profile.id!, false)}>
                  Tolak Pengajuan
                </Button>
                <Button variant="success" onClick={() => handleDecision(selectedItem.profile.id!, true)}>
                  Setujui & Teruskan ke Yayasan
                </Button>
              </div>
            )}
          </Card>
        </ModalBackdrop>
      )}

      <div className="animate-fade-in text-sm">
        <div className={showTab(currentActiveTab, OVERVIEW_TAB)}>
          <div className="space-y-2">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-bea-sage">
                    Halo, <span className="font-semibold text-bea-ink">{user?.name?.split(' ').slice(-2).join(' ') || 'Validator'}</span>
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold text-bea-ink md:text-xl">
                    Ringkasan validasi sekolah
                  </h2>
                  {schoolsInScope.length > 0 && (
                    <p className="mt-1.5 text-xs text-bea-copper font-medium">
                      {schoolsInScope.join(' · ')}
                    </p>
                  )}
                </div>
                {stats.pending > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('Penyamaan Berkas')}
                    className="shrink-0"
                  >
                    {stats.pending} antrian
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                )}
              </div>

              <div className="portal-kpi-grid mt-2">
                <div className="portal-kpi portal-kpi--amber">
                  <span className="portal-kpi-value">{stats.pending}</span>
                  <span className="portal-kpi-label">Antrian validasi</span>
                </div>
                <div className="portal-kpi portal-kpi--copper">
                  <span className="portal-kpi-value">{stats.approvedByValidator}</span>
                  <span className="portal-kpi-label">Disetujui → yayasan</span>
                </div>
                <div className="portal-kpi portal-kpi--green">
                  <span className="portal-kpi-value">{stats.acceptedFinal}</span>
                  <span className="portal-kpi-label">Diterima final</span>
                </div>
                <div className="portal-kpi portal-kpi--rose">
                  <span className="portal-kpi-value">{stats.rejected}</span>
                  <span className="portal-kpi-label">Ditolak</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-2 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <div className="portal-section-head">
                  <div>
                    <h3 className="portal-section-title flex items-center gap-2">
                      <CheckSquare size={18} className="text-bea-copper" />
                      Perlu ditinjau
                    </h3>
                    <p className="portal-section-desc">Guru yang menunggu keputusan Anda sebagai kepala sekolah.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('Penyamaan Berkas')}>
                    Lihat semua
                  </Button>
                </div>

                <div className="space-y-2">
                  {queue.length > 0 ? (
                    queue.slice(0, 4).map((item) => (
                      <div key={item.profile.id} className="portal-list-item">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={item.profile.photoUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full border border-bea-line object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-bea-ink">{item.profile.fullName}</p>
                            <p className="truncate text-xs text-bea-sage">{item.profile.jobTitle}</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>
                          Periksa
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-bea-line bg-bea-ivory-light/80 px-3 py-4 text-center">
                      <CheckCircle size={28} className="mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-semibold text-bea-ink">Antrian bersih</p>
                      <p className="mt-1 text-xs text-bea-sage">Semua berkas guru sudah diproses.</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="lg:col-span-2">
                <div className="portal-section-head !mb-3">
                  <div>
                    <h3 className="portal-section-title flex items-center gap-2">
                      <FileCheck size={18} className="text-bea-copper" />
                      Checklist validator
                    </h3>
                  </div>
                </div>
                <div className="portal-checklist">
                  <div className="portal-checklist-item">
                    <strong>Foto & gaji</strong>
                    Cocokkan foto mengajar dan nominal honorer dengan catatan sekolah.
                  </div>
                  <div className="portal-checklist-item">
                    <strong>Rekening bank</strong>
                    Pastikan rekening penerima atas nama guru yang bersangkutan.
                  </div>
                  <div className="portal-checklist-item">
                    <strong>Riwayat</strong>
                    Lacak status guru di tab Riwayat Guru setelah keputusan diambil.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setActiveTab(VALIDATOR_HISTORY_TAB)}
                >
                  Buka riwayat validasi
                </Button>
              </Card>
            </div>
          </div>
        </div>

        <div className={showTab(currentActiveTab, 'Penyamaan Berkas')}>
          <Card>
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title flex items-center gap-2 text-base md:text-lg">
                  <CheckSquare className="text-bea-copper-dark" size={20} />
                  Antrian pemeriksaan berkas
                </h2>
                <p className="portal-section-desc">
                  Verifikasi pengajuan guru honorer di sekolah binaan Anda.
                </p>
              </div>
              <Badge variant="warning">{filteredQueue.length} menunggu</Badge>
            </div>

            <div className="space-y-2">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((item) => (
                  <div key={item.profile.id} className="portal-list-item">
                    <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                      <img
                        src={item.profile.photoUrl}
                        alt={item.profile.fullName}
                        className="h-11 w-11 shrink-0 rounded-full border border-bea-line object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-bea-ink">{item.profile.fullName}</h4>
                        <p className="truncate text-xs text-bea-sage">
                          {item.profile.jobTitle} · <span className="font-medium text-bea-copper">{item.institutionName}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>
                      Periksa
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-bea-line py-6 text-center text-bea-sage">
                  <CheckCircle size={32} className="mx-auto mb-2 text-bea-copper" />
                  <p className="text-sm font-semibold text-bea-ink">Antrian bersih</p>
                  <p className="mt-1 text-xs">Seluruh berkas guru sudah divalidasi.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className={showTab(currentActiveTab, VALIDATOR_HISTORY_TAB)}>
          <Card>
            <div className="portal-section-head">
              <div>
                <h2 className="portal-section-title flex items-center gap-2 text-base md:text-lg">
                  <History className="text-bea-copper-dark" size={20} />
                  Riwayat validasi guru
                </h2>
                <p className="portal-section-desc">
                  Guru di sekolah binaan yang sudah diproses — disetujui, ditolak, atau menunggu yayasan.
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Semua'],
                  ['pending_foundation', 'Menunggu Yayasan'],
                  ['approved', 'Diterima Final'],
                  ['rejected', 'Ditolak'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    historyFilter === key
                      ? 'bg-bea-copper text-white border-bea-copper'
                      : 'bg-white border-bea-line text-bea-sage hover:border-bea-copper/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <div key={item.profile.id} className="portal-list-item !items-start sm:!items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.profile.photoUrl}
                        alt={item.profile.fullName}
                        className="h-10 w-10 shrink-0 rounded-full border border-bea-line object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-bea-ink">{item.profile.fullName}</h4>
                        <p className="truncate text-xs text-bea-sage">
                          {item.profile.jobTitle} · <span className="font-medium text-bea-copper">{item.institutionName}</span>
                        </p>
                        {item.profile.updatedAt && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-bea-sage-muted">
                            <Clock size={10} />
                            {new Date(item.profile.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={applicationStatusVariant(item.profile.status)}>
                        {applicationStatusLabel(item.profile.status, {
                          perspective: 'validator',
                          rejectedBy: item.profile.rejectedBy,
                        })}
                      </Badge>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>
                        Detail
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-bea-line py-10 text-center text-bea-sage">
                  <User size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium text-bea-ink">Belum ada riwayat untuk filter ini</p>
                  <p className="mt-1 text-xs">Pengajuan baru ada di tab Validasi Berkas.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
};

export default ValidatorDashboard;
