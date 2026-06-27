import React from 'react';
import { PortalShell } from '@core/ui/PortalShell';
import Card from '@core/ui/Card';
import StatCard, { StatGrid } from '@core/ui/StatCard';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { usePortalNav } from '@core/routing/usePortalNav';
import { applicationStatusVariant, applicationStatusLabel } from '@core/domain/applicationStatus';
import { PortalModal } from '@core/ui/PortalModal';
import ManageInstitutionModal from '@modules/institutions/components/ManageInstitutionModal';
import { PlusCircle, Edit, Download, TrendingUp, TrendingDown, ClipboardCheck, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { showTab } from '@core/ui/tabPanel';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { beaTextarea, beaFieldLabel } from '@core/ui/beaTheme';
import {
  AdminDashboardProvider,
  useAdminDashboardContext,
} from '../context/AdminDashboardContext';

function AdminDashboardContent() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const {
    user,
    institutions,
    validators,
    pendingApprovals,
    stats,
    isModalOpen,
    editingInstitution,
    reportsWithDetails,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    activeApprovalReview,
    setActiveApprovalReview,
    transactions,
    termsDraft,
    patchTerms,
    isTermsDirty,
    validatorMap,
    sortedTeachers,
    filteredInstitutions,
    handleReportDecision,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveInstitution,
    handleAdminDecision,
    handleSaveTerms,
    handleExportFinancials,
    toggleSortDirection,
  } = useAdminDashboardContext();

  return (
    <PortalShell title="Dasbor Admin Yayasan" onSearch={setSearchQuery}>
      {/* Institution Modal popup */}
      {isModalOpen && (
        <ManageInstitutionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveInstitution}
          institution={editingInstitution}
          validators={validators}
          userId={user.id}
        />
      )}

      {/* Admin Review Action Dialog */}
      {activeApprovalReview && (
        <PortalModal
          id="admin-review-backdrop"
          title={`Persetujuan Final Yayasan: ${activeApprovalReview.profile.fullName}`}
          onClose={() => setActiveApprovalReview(null)}
          size="lg"
          footer={
            <>
              <Button variant="danger" onClick={() => handleAdminDecision(activeApprovalReview.profile.id!, false)}>Tolak</Button>
              <Button variant="success" onClick={() => handleAdminDecision(activeApprovalReview.profile.id!, true)}>Setujui Profil (Publikasikan)</Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex gap-4 items-center">
              <img src={activeApprovalReview.profile.photoUrl} alt="Formal" className="w-16 h-16 rounded-full object-cover border border-bea-line" />
              <div>
                <h4 className="font-bold text-base text-bea-ink">{activeApprovalReview.profile.fullName}</h4>
                <p className="text-xs text-bea-sage font-semibold">{activeApprovalReview.profile.jobTitle} &bull; {activeApprovalReview.institutionName}</p>
              </div>
            </div>

            <div className="portal-data-grid text-xs">
              <div className="portal-data-cell">
                <span className="portal-data-cell-label">Gaji Honorer</span>
                <span className="font-bold text-bea-ink">Rp {activeApprovalReview.profile.monthlySalary.toLocaleString('id-ID')}</span>
              </div>
              <div className="portal-data-cell">
                <span className="portal-data-cell-label">No Rekening</span>
                <span className="font-bold text-bea-ink truncate block">{activeApprovalReview.profile.bankAccountNumber}</span>
              </div>
              <div className="portal-data-cell">
                <span className="portal-data-cell-label">Pemeriksaan Validator</span>
                <span className="font-bold text-emerald-600">VALID / AMAN</span>
              </div>
            </div>

            <div>
              <span className={beaFieldLabel}>Pernyataan Alasan Pengaju</span>
              <p className="portal-quote text-xs">
                "{activeApprovalReview.profile.reason}"
              </p>
            </div>
          </div>
        </PortalModal>
      )}

      <div className={showTab(currentActiveTab, OVERVIEW_TAB)}>
      <StatGrid>
        <StatCard tone="copper" label="Total Donatur Aktif" value={stats.donorCount.toLocaleString('id-ID')} />
        <StatCard tone="green" label="Guru Penerima Manfaat" value={stats.fundedTeachersCount} />
        <StatCard tone="default" label="Dana Terserap" value={`Rp ${stats.raised.toLocaleString('id-ID')}`} />
        <StatCard tone="amber" label="Menunggu Persetujuan" value={stats.pendingSubmissionsCount} />
      </StatGrid>
      </div>

      <div className="portal-page-body">
        {pendingApprovals.length > 0 && (
          <div className={showTab(currentActiveTab, OVERVIEW_TAB)}>
            <Card>
              <PortalSectionHead
                icon={ClipboardCheck}
                title="Persetujuan Pendaftaran Guru Honorer Baru"
                description="Guru-guru di bawah ini telah divalidasi Kepala Sekolah. Berikan persetujuan yayasan untuk dipublikasi."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {pendingApprovals.map((item, idx) => (
                  <div key={idx} className="portal-list-item">
                    <div className="flex gap-3 min-w-0">
                      <img src={item.profile.photoUrl} alt="Honorer face" className="w-10 h-10 rounded-full object-cover border border-bea-line shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-bea-ink truncate">{item.profile.fullName}</p>
                        <p className="text-[11px] text-bea-sage font-semibold truncate">{item.profile.jobTitle} &bull; <span className="text-bea-copper-dark uppercase">{item.institutionName}</span></p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setActiveApprovalReview(item)}>Periksa & Acc</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className={showTab(currentActiveTab, 'Sekolah & Institusi', 'fill')}>
          <Card className="portal-card--fill">
            <PortalSectionHead
              title="Manajemen Sekolah & Validator Swakarsa"
              description="Mendaftarkan institusi sekolah dasar / menengah baru dan menugaskan validator yang terverifikasi."
              action={
                <Button onClick={handleOpenAddModal} size="sm">
                  <PlusCircle size={15} className="mr-1.5" />
                  Tambah Sekolah Baru
                </Button>
              }
            />

            <div className="portal-table-wrap portal-table-wrap--fill mt-2">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th className="py-2.5 px-4">Nama Institusi</th>
                    <th className="py-2.5 px-4">Alamat Domisili</th>
                    <th className="py-2.5 px-4">Kepala Sekolah (Validator)</th>
                    <th className="py-2.5 px-4 text-center">Operasional</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst.id}>
                      <td className="font-bold text-bea-ink">{inst.name}</td>
                      <td className="text-bea-sage">{inst.address}</td>
                      <td className="font-medium">{validatorMap[inst.validatorUserId] || 'Belum Ditugaskan'}</td>
                      <td className="text-center">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(inst)}>
                          <Edit size={12} className="mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className={showTab(currentActiveTab, 'Buku Ledger Keuangan', 'fill')}>
          <Card className="portal-card--fill">
            <PortalSectionHead
              title="Buku Besar Kas & Log Penyaluran Audit"
              description="Pencatatan mutasi penyaluran Bea Guru terpusat penjamin keutuhan transparansi publik."
              action={
                <Button variant="secondary" onClick={handleExportFinancials} size="sm">
                  <Download size={14} className="mr-1.5" />
                  Ekspor Buku Audit
                </Button>
              }
            />

            <div className="portal-table-wrap portal-table-wrap--fill mt-2">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Tanggal Ledger</th>
                    <th>Uraian Transaksi</th>
                    <th className="text-right">Jumlah (Lunas)</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-bea-sage-muted">{trx.date}</td>
                      <td>{trx.description}</td>
                      <td className={`text-right font-bold ${trx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <span className="inline-flex items-center justify-end gap-1">
                          {trx.type === 'IN' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          Rp {trx.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className={showTab(currentActiveTab, OVERVIEW_TAB, 'fill')}>
          <Card variant="flat" className="portal-card--fill">
            <div className="portal-toolbar">
              <h3 className="portal-section-title">Aliran Status Guru (Transparansi Publik)</h3>
              <div className="portal-toolbar-actions">
                <select
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value as any }))}
                  className="portal-select-compact"
                  aria-label="Urutkan berdasarkan"
                >
                  <option value="fullName">Nama Guru</option>
                  <option value="jobTitle">Jabatan</option>
                  <option value="status">Status</option>
                </select>
                <button type="button" onClick={toggleSortDirection} className="portal-icon-btn" aria-label="Balik urutan">
                  <ArrowUpDown size={12} />
                </button>
              </div>
            </div>

            <div className="portal-scroll-list portal-scroll-list--fill">
              {sortedTeachers.map((t, idx) => (
                <div key={idx} className="portal-list-item portal-list-item--compact">
                  <div className="flex min-w-0 items-center gap-2">
                    <img src={t.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-bea-line object-cover" />
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-semibold text-bea-ink">{t.fullName}</h4>
                      <p className="truncate text-[10px] text-bea-sage-muted">
                        {t.jobTitle} &bull; {institutions.find(i => i.id === t.institutionId)?.name || 'Sekolah'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={applicationStatusVariant(t.status)}>
                    {applicationStatusLabel(t.status, { perspective: 'admin' })}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={`portal-page-grid portal-page-grid--2-1 ${showTab(currentActiveTab, 'Validasi Laporan & Kebijakan', 'fill-grid')}`}>
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            <Card className="portal-card--fill border">
              <h3 className="portal-section-title text-base mb-1">Persetujuan Laporan Kelas Honorer</h3>
              <p className="portal-section-desc mb-3">Periksa keabsahan naratif pengajaran dan foto fisik KBM guru sebelum dipublikasikan di feed transparansi donatur.</p>

              <div className="portal-scroll-pane space-y-4">
                {reportsWithDetails.filter(r => r.report.status === 'PENDING').length > 0 ? (
                  reportsWithDetails.filter(r => r.report.status === 'PENDING').map((r, i) => (
                    <div key={i} className="portal-inset-panel space-y-3">
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={r.teacherPhoto} alt={r.teacherName} className="w-8 h-8 rounded-full object-cover border border-bea-line" />
                          <div>
                            <h4 className="font-bold text-xs text-bea-ink">{r.teacherName}</h4>
                            <p className="text-[10px] text-bea-sage-muted">{r.jobTitle} &bull; {r.institutionName}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] text-bea-sage-muted">
                          {new Date(r.report.submittedAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <p className="text-xs text-bea-sage italic whitespace-pre-wrap md:col-span-2 leading-relaxed">
                          "{r.report.description}"
                        </p>
                        {r.report.photoUrl && (
                          <img src={r.report.photoUrl} alt="KBM" className="w-full h-20 object-cover rounded-lg border border-bea-line md:col-span-1" />
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-bea-line">
                        <Button size="xs" variant="secondary" className="px-3 py-1 text-[10px]" onClick={() => handleReportDecision(r.report.id!, false)}>
                          Tolak
                        </Button>
                        <Button size="xs" className="px-3 py-1 text-[10px]" onClick={() => handleReportDecision(r.report.id!, true)}>
                          Setujui & Lumat Rilis
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-bea-sage-muted text-xs">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-bea-copper mb-1">Semua Laporan Bersih!</p>
                    <p>Tidak ada laporan bulanan guru yang sedang menunggu persetujuan yayasan.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border shrink-0">
              <h3 className="portal-section-title text-base mb-1">Arsip Laporan Kelas Terbit (Terverifikasi)</h3>
              <p className="portal-section-desc mb-3">Laporan perkembangan belajar guru honorer yang telah divalidasi dan tersiar aktif demi memelihara akuntabilitas donasi.</p>

              <div className="portal-scroll-pane max-h-40 space-y-2">
                {reportsWithDetails.filter(r => r.report.status === 'APPROVED').length > 0 ? (
                  reportsWithDetails.filter(r => r.report.status === 'APPROVED').map((r, i) => (
                    <div key={i} className="portal-inset-panel p-2.5 flex items-center justify-between text-xs">
                      <div className="flex gap-2.5 items-center">
                        <img src={r.teacherPhoto} alt={r.teacherName} className="w-6 h-6 rounded-full object-cover border border-bea-line" />
                        <div>
                          <h4 className="font-bold text-bea-ink">{r.teacherName}</h4>
                          <p className="text-bea-sage-muted text-[10px] line-clamp-1">{r.report.description}</p>
                        </div>
                      </div>
                      <Badge variant="success">APPROVED</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-bea-sage-muted text-[11px]">Belum ada laporan bervaluasi disetujui.</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="portal-card--fill border flex flex-col justify-between">
            <div className="space-y-3 min-h-0 flex-1 flex flex-col overflow-hidden">
              <h3 className="portal-section-title text-base shrink-0">Pengaturan Kebijakan (T&C)</h3>
              <DraftStatusBanner isDirty={isTermsDirty} />
              <textarea
                value={termsDraft.text}
                onChange={(e) => patchTerms({ text: e.target.value })}
                rows={12}
                className={`${beaTextarea} text-xs leading-normal flex-1 min-h-0 mb-4`}
              />
            </div>
            <Button size="sm" onClick={handleSaveTerms} className="w-full py-2.5 text-xs uppercase tracking-wider font-bold shrink-0">
              <ShieldCheck className="mr-1.5" size={14} />
              Simpan & Publikasikan
            </Button>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}

const AdminDashboard = () => (
  <AdminDashboardProvider>
    <AdminDashboardContent />
  </AdminDashboardProvider>
);

export default AdminDashboard;
