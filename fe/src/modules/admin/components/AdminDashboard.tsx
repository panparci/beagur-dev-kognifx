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
import ManageDonorModal from '@modules/donors/components/ManageDonorModal';
import { DonationVerificationStatus } from '@core/types';
import { openAuthenticatedFile } from '@core/api/axiosClient';
import { PlusCircle, Edit, Download, TrendingUp, TrendingDown, ClipboardCheck, ArrowUpDown } from 'lucide-react';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { showTab } from '@core/ui/tabPanel';
import { beaFieldLabel, beaInput } from '@core/ui/beaTheme';
import {
  AdminDashboardProvider,
  useAdminDashboardContext,
} from '../context/AdminDashboardContext';
import { AdminAnalyticsTab } from './tabs/AdminAnalyticsTab';
import { AdminLandingCmsTab } from './tabs/AdminLandingCmsTab';
import { AdminTermsTab } from './tabs/AdminTermsTab';
import { AdminReportsOverviewCard } from './AdminReportsOverviewCard';

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
    validatorMap,
    sortedTeachers,
    filteredInstitutions,
    handleReportDecision,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveInstitution,
    handleAdminDecision,
    handleExportFinancials,
    toggleSortDirection,
    donors,
    donations,
    isDonorModalOpen,
    editingDonor,
    reviewDonation,
    setReviewDonation,
    invoiceDonorId,
    setInvoiceDonorId,
    invoiceAmount,
    setInvoiceAmount,
    invoiceNumber,
    setInvoiceNumber,
    isDisburseOpen,
    setIsDisburseOpen,
    disburseTeacherId,
    setDisburseTeacherId,
    disburseAmount,
    setDisburseAmount,
    disburseDescription,
    setDisburseDescription,
    approvedTeachers,
    handleOpenAddDonor,
    handleOpenEditDonor,
    handleCloseDonorModal,
    handleSaveDonor,
    handleVerifyDonation,
    handleCreateInvoice,
    handleDisburse,
    auditLogs,
    handleDeactivateDonor,
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

      {isDonorModalOpen && (
        <ManageDonorModal
          isOpen={isDonorModalOpen}
          onClose={handleCloseDonorModal}
          onSave={handleSaveDonor}
          donor={editingDonor}
        />
      )}

      {reviewDonation && (
        <PortalModal
          id="donation-review-backdrop"
          title={`Verifikasi Donasi: ${reviewDonation.donorName ?? 'Donatur'}`}
          onClose={() => setReviewDonation(null)}
          footer={
            <>
              <Button variant="danger" onClick={() => handleVerifyDonation(reviewDonation.id!, false)}>Tolak</Button>
              <Button variant="success" onClick={() => handleVerifyDonation(reviewDonation.id!, true, reviewDonation.invoiceNumber)}>Verifikasi</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p><strong>Nominal:</strong> Rp {reviewDonation.amount.toLocaleString('id-ID')}</p>
            <p><strong>Guru tujuan:</strong> {reviewDonation.teacherName || 'Umum yayasan'}</p>
            {reviewDonation.invoiceNumber && <p><strong>No. Tagihan:</strong> {reviewDonation.invoiceNumber}</p>}
            {reviewDonation.proofUrl && (
              <p>
                <strong>Bukti transfer:</strong>{' '}
                <button
                  type="button"
                  className="text-bea-copper-dark underline font-semibold"
                  onClick={() => void openAuthenticatedFile(reviewDonation.proofUrl!)}
                >
                  Lihat bukti
                </button>
              </p>
            )}
          </div>
        </PortalModal>
      )}

      {isDisburseOpen && (
        <PortalModal
          id="disburse-backdrop"
          title="Catat Penyaluran ke Guru"
          onClose={() => setIsDisburseOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDisburseOpen(false)}>Batal</Button>
              <Button onClick={() => void handleDisburse()}>Salurkan</Button>
            </>
          }
        >
          <div className="portal-form-stack text-sm">
            <div>
              <label className={beaFieldLabel}>Guru Penerima</label>
              <select className={beaInput} value={disburseTeacherId} onChange={(e) => setDisburseTeacherId(e.target.value)}>
                <option value="">Pilih guru...</option>
                {approvedTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={beaFieldLabel}>Nominal (Rp)</label>
              <input className={beaInput} type="number" min={1} value={disburseAmount} onChange={(e) => setDisburseAmount(e.target.value)} />
            </div>
            <div>
              <label className={beaFieldLabel}>Keterangan</label>
              <input className={beaInput} value={disburseDescription} onChange={(e) => setDisburseDescription(e.target.value)} placeholder="Penyaluran bulanan..." />
            </div>
          </div>
        </PortalModal>
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
        <StatCard tone="amber" label="Menunggu Persetujuan Guru" value={stats.pendingSubmissionsCount} />
        <StatCard tone="rose" label="Donasi Perlu Verifikasi" value={stats.pendingDonationsCount} />
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

        <div className={showTab(currentActiveTab, OVERVIEW_TAB)}>
          <AdminReportsOverviewCard
            reports={reportsWithDetails}
            onDecision={handleReportDecision}
          />
        </div>

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
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsDisburseOpen(true)} size="sm">
                    Catat Penyaluran
                  </Button>
                  <Button variant="secondary" onClick={handleExportFinancials} size="sm">
                    <Download size={14} className="mr-1.5" />
                    Ekspor Buku Audit
                  </Button>
                </div>
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

        <div className={showTab(currentActiveTab, 'Donatur & Donasi', 'fill')}>
          <div className="portal-page-grid portal-page-grid--2-1 gap-3 min-h-0">
            <Card className="portal-card--fill">
              <PortalSectionHead
                title="Daftar Donatur"
                description="Kelola profil donatur dan total kontribusi terverifikasi."
                action={
                  <Button onClick={handleOpenAddDonor} size="sm">
                    <PlusCircle size={15} className="mr-1.5" />
                    Tambah Donatur
                  </Button>
                }
              />
              <div className="portal-table-wrap portal-table-wrap--fill mt-2">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email / Telepon</th>
                      <th className="text-right">Total Donasi</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((d) => (
                      <tr key={d.id}>
                        <td className="font-bold text-bea-ink">{d.name}</td>
                        <td className="text-bea-sage text-xs">
                          {d.email}
                          {d.phone ? ` · ${d.phone}` : ''}
                        </td>
                        <td className="text-right font-bold">Rp {d.totalDonation.toLocaleString('id-ID')}</td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="secondary" size="sm" onClick={() => handleOpenEditDonor(d)}>
                              <Edit size={12} className="mr-1" />
                              Edit
                            </Button>
                            {d.isActive && (
                              <Button variant="danger" size="sm" onClick={() => void handleDeactivateDonor(d)}>
                                Nonaktif
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="portal-card--fill">
              <PortalSectionHead title="Buat Tagihan Manual" description="Invoice donasi sebelum transfer masuk." />
              <div className="portal-form-stack mt-2 text-sm">
                <select className={beaInput} value={invoiceDonorId} onChange={(e) => setInvoiceDonorId(e.target.value)}>
                  <option value="">Pilih donatur...</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input className={beaInput} type="number" placeholder="Nominal (Rp)" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
                <input className={beaInput} placeholder="No. tagihan (opsional)" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                <Button size="sm" onClick={() => void handleCreateInvoice()}>Buat Tagihan</Button>
              </div>
            </Card>
          </div>

          <Card className="portal-card--fill mt-3">
            <PortalSectionHead title="Verifikasi Donasi" description="Periksa bukti transfer sebelum donasi masuk ke ledger." />
            <div className="portal-table-wrap portal-table-wrap--fill mt-2">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Donatur</th>
                    <th>Guru</th>
                    <th className="text-right">Jumlah</th>
                    <th>Status</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td className="font-mono text-bea-sage-muted text-xs">{new Date(d.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>{d.donorName ?? d.donorUserId}</td>
                      <td className="text-xs text-bea-sage">{d.teacherName || '—'}</td>
                      <td className="text-right font-bold">Rp {d.amount.toLocaleString('id-ID')}</td>
                      <td>
                        <Badge variant={d.verificationStatus === DonationVerificationStatus.VERIFIED ? 'success' : d.verificationStatus === DonationVerificationStatus.REJECTED ? 'danger' : 'warning'}>
                          {d.verificationStatus ?? 'PENDING'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {d.verificationStatus === DonationVerificationStatus.PENDING && (
                          <Button variant="secondary" size="sm" onClick={() => setReviewDonation(d)}>Periksa</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="portal-card--fill mt-3">
            <PortalSectionHead title="Jejak Aktivitas Admin" description="Log verifikasi donasi, penyaluran, dan perubahan donatur." />
            <div className="portal-scroll-pane max-h-48 mt-2 space-y-2">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="portal-inset-panel text-xs flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-bea-ink">{log.action}</p>
                      <p className="text-bea-sage-muted">
                        {log.actorName} · {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-bea-sage-muted shrink-0">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-bea-sage-muted text-xs py-4">Belum ada aktivitas tercatat.</p>
              )}
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
                  <option value="institutionName">Sekolah</option>
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

        <AdminTermsTab />

        <AdminAnalyticsTab />
        <AdminLandingCmsTab />
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
