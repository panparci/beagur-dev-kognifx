import { useMemo, useState } from 'react';
import { ExternalLink, ChevronUp, ChevronDown, X, Upload, ChevronDown as ChevronDownIcon } from 'lucide-react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import { showTab } from '@core/ui/tabPanel';
import { ADMIN_LANDING_CMS_TAB } from '@core/constants/tabs';
import { usePortalNav } from '@core/routing/usePortalNav';
import { beaFieldLabel } from '@core/ui/beaTheme';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { useAdminDashboardContext } from '../../context/AdminDashboardContext';
import { LandingCmsPreview } from '../landing/LandingCmsPreview';

export function AdminLandingCmsTab() {
  const { activeTab } = usePortalNav();
  const {
    landingDraft,
    patchLanding,
    isLandingDirty,
    handleSaveLanding,
    approvedTeachers,
  } = useAdminDashboardContext();

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const active = activeTab === ADMIN_LANDING_CMS_TAB;

  const publishedTeachers = useMemo(
    () =>
      approvedTeachers
        .filter((t) => t.isPublished !== false)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [approvedTeachers],
  );

  const featuredSet = useMemo(
    () => new Set(landingDraft.featuredTeacherIds),
    [landingDraft.featuredTeacherIds],
  );

  const moveFeatured = (id: string, dir: -1 | 1) => {
    const ids = [...landingDraft.featuredTeacherIds];
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    patchLanding({ featuredTeacherIds: ids });
  };

  const toggleFeatured = (id: string) => {
    if (featuredSet.has(id)) {
      patchLanding({
        featuredTeacherIds: landingDraft.featuredTeacherIds.filter((x) => x !== id),
      });
      return;
    }
    patchLanding({ featuredTeacherIds: [...landingDraft.featuredTeacherIds, id] });
  };

  if (!active) return null;

  return (
    <div className={showTab(activeTab, ADMIN_LANDING_CMS_TAB, 'fill')}>
      <div className="portal-scroll-pane space-y-4 flex-1 min-h-0 pb-6">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-bea-copper">Admin Yayasan</p>
            <h2 className="font-serif text-xl font-semibold text-bea-ink">Kelola Halaman Depan</h2>
            <p className="text-xs text-bea-sage-muted mt-1 max-w-xl">
              Pratinjau seperti landing page — klik pensil untuk ubah teks, lalu publikasikan agar tampil di situs.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-bea-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <DraftStatusBanner isDirty={isLandingDirty} />
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="bea-btn-secondary inline-flex items-center gap-1.5 min-h-9 px-4 text-xs font-semibold"
              >
                Pratinjau live
                <ExternalLink size={14} aria-hidden />
              </a>
              <Button
                size="sm"
                onClick={handleSaveLanding}
                disabled={!isLandingDirty}
                className="inline-flex items-center gap-1.5 min-h-9 px-5 text-xs font-bold"
              >
                <Upload size={14} aria-hidden />
                Publikasikan
              </Button>
            </div>
          </div>
        </div>

        <LandingCmsPreview content={landingDraft} onPatch={patchLanding} />

        <Card className="portal-card overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-bea-ivory-light/80"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <span>
              <span className={beaFieldLabel}>Pengaturan lanjutan</span>
              <span className="block text-[11px] text-bea-sage-muted mt-0.5">
                Urutan foto guru di galeri (opsional)
              </span>
            </span>
            <ChevronDownIcon
              size={16}
              className={`shrink-0 text-bea-sage transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {advancedOpen ? (
            <div className="border-t border-bea-line px-4 py-3 space-y-2">
              {landingDraft.featuredTeacherIds.length > 0 ? (
                <ul className="space-y-1">
                  {landingDraft.featuredTeacherIds.map((id) => {
                    const teacher = publishedTeachers.find((t) => (t.id ?? t.userId) === id);
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-1 rounded-md border border-bea-line bg-white px-2 py-1 text-xs"
                      >
                        <span className="flex-1 truncate">{teacher?.fullName ?? id}</span>
                        <button
                          type="button"
                          className="p-1 text-bea-sage hover:text-bea-copper"
                          onClick={() => moveFeatured(id, -1)}
                          aria-label="Naik"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-bea-sage hover:text-bea-copper"
                          onClick={() => moveFeatured(id, 1)}
                          aria-label="Turun"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-bea-sage hover:text-red-600"
                          onClick={() => toggleFeatured(id)}
                          aria-label="Hapus"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[11px] text-bea-sage-muted italic">Belum ada urutan khusus — pakai abjad.</p>
              )}
              <div className="max-h-40 overflow-y-auto rounded-md border border-bea-line divide-y divide-bea-line/70">
                {publishedTeachers.length === 0 ? (
                  <p className="p-2 text-[11px] text-bea-sage-muted">Belum ada guru publik.</p>
                ) : (
                  publishedTeachers.map((t) => {
                    const id = t.id ?? t.userId;
                    const selected = featuredSet.has(id);
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-bea-ivory-light"
                      >
                        <input type="checkbox" checked={selected} onChange={() => toggleFeatured(id)} />
                        <span className="truncate">{t.fullName}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
