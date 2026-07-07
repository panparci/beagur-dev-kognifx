import { useMemo } from 'react';
import { Archive, Clock, FileText } from 'lucide-react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead, PortalStatChip } from '@core/ui/portal/PortalPrimitives';
import type { AdminReportDetail } from '../hooks/useAdminDashboard';

type AdminReportsOverviewCardProps = {
  reports: AdminReportDetail[];
  onDecision: (reportId: string, approved: boolean) => void;
};

export function AdminReportsOverviewCard({ reports, onDecision }: AdminReportsOverviewCardProps) {
  const pending = useMemo(() => reports.filter((r) => r.report.status === 'PENDING'), [reports]);
  const approved = useMemo(() => reports.filter((r) => r.report.status === 'APPROVED'), [reports]);

  if (pending.length === 0 && approved.length === 0) return null;

  const twoCol = pending.length > 0 && approved.length > 0;

  return (
    <Card>
      <PortalSectionHead
        icon={FileText}
        title="Laporan Kelas Honorer"
        description="Setujui laporan baru sebelum tampil ke donatur, dan pantau arsip yang sudah dipublikasikan."
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        <PortalStatChip label="Menunggu" value={pending.length} />
        <PortalStatChip label="Arsip" value={approved.length} />
      </div>

      <div className={twoCol ? 'grid gap-4 lg:grid-cols-2 lg:items-start' : 'space-y-4'}>
        {pending.length > 0 ? (
          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-bea-copper">
              <Clock size={13} aria-hidden />
              Menunggu persetujuan
            </h3>
            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-0.5">
              {pending.map((r) => (
                <article key={r.report.id} className="portal-inset-panel space-y-3">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={r.teacherPhoto}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-bea-line shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-bea-ink truncate">{r.teacherName}</h4>
                        <p className="text-[11px] text-bea-sage-muted truncate">
                          {r.jobTitle} &bull; {r.institutionName}
                        </p>
                      </div>
                    </div>
                    <time className="font-mono text-[10px] text-bea-sage-muted shrink-0">
                      {new Date(r.report.submittedAt).toLocaleDateString('id-ID')}
                    </time>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3">
                    <p className="text-xs text-bea-sage leading-relaxed whitespace-pre-wrap">
                      {r.report.description}
                    </p>
                    {r.report.photoUrl ? (
                      <img
                        src={r.report.photoUrl}
                        alt="Foto KBM"
                        className="w-full h-20 sm:h-full min-h-[5rem] object-cover rounded-lg border border-bea-line"
                      />
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-bea-line">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => onDecision(r.report.id!, false)}
                    >
                      Tolak
                    </Button>
                    <Button size="xs" onClick={() => onDecision(r.report.id!, true)}>
                      Setujui & Publikasikan
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {approved.length > 0 ? (
          <section className={`space-y-3 ${twoCol ? '' : pending.length > 0 ? 'pt-4 border-t border-bea-line lg:pt-0 lg:border-t-0' : ''}`}>
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-bea-sage-muted">
              <Archive size={13} aria-hidden />
              Arsip terverifikasi
            </h3>
            <ul className="space-y-2 max-h-[26rem] overflow-y-auto pr-0.5">
              {approved.map((r) => (
                <li
                  key={r.report.id}
                  className="portal-inset-panel flex items-center gap-3 p-2.5"
                >
                  <img
                    src={r.teacherPhoto}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-bea-line shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-bea-ink truncate">{r.teacherName}</h4>
                    <p className="text-[10px] text-bea-sage-muted line-clamp-2 leading-snug mt-0.5">
                      {r.report.description}
                    </p>
                    <time className="text-[9px] text-bea-sage-muted font-mono mt-1 block">
                      {new Date(r.report.submittedAt).toLocaleDateString('id-ID')}
                    </time>
                  </div>
                  <Badge variant="success" className="shrink-0 text-[9px]">
                    Disetujui
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Card>
  );
}
