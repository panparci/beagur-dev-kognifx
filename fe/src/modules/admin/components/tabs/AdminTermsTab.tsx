import { ShieldCheck } from 'lucide-react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { beaTextarea } from '@core/ui/beaTheme';
import DraftStatusBanner from '@core/ui/DraftStatusBanner';
import { SITE_ORG } from '@core/constants/siteMeta';
import { useAdminDashboardContext } from '../../context/AdminDashboardContext';

const TERMS_TAB = 'Validasi Laporan & Kebijakan';

export function AdminTermsTab() {
  const { activeTab } = usePortalNav();
  const { termsDraft, patchTerms, isTermsDirty, handleSaveTerms } = useAdminDashboardContext();

  if (activeTab !== TERMS_TAB) return null;

  return (
    <div className={showTab(activeTab, TERMS_TAB, 'fill')}>
      <div className="portal-scroll-pane space-y-4 flex-1 min-h-0 pb-6">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-bea-copper">Kebijakan</p>
            <h2 className="font-serif text-xl font-semibold text-bea-ink">Syarat & Ketentuan</h2>
            <p className="text-xs text-bea-sage-muted mt-1 max-w-xl">
              Teks ini muncul saat donatur membuka Syarat & Ketentuan dari navbar atau footer landing.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-bea-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <DraftStatusBanner isDirty={isTermsDirty} />
            <Button
              size="sm"
              onClick={handleSaveTerms}
              disabled={!isTermsDirty}
              className="inline-flex items-center gap-1.5 min-h-9 px-5 text-xs font-bold shrink-0"
            >
              <ShieldCheck size={14} aria-hidden />
              Publikasikan T&C
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <Card className="portal-card p-4 space-y-3">
            <div>
              <h3 className="portal-section-title text-sm">Editor teks</h3>
              <p className="portal-section-desc mt-0.5">Paragraf baru = baris kosong. Simpan hanya saat siap dipublikasikan.</p>
            </div>
            <textarea
              value={termsDraft.text}
              onChange={(e) => patchTerms({ text: e.target.value })}
              rows={16}
              className={`${beaTextarea} text-sm leading-relaxed min-h-[18rem]`}
              aria-label="Isi syarat dan ketentuan"
            />
          </Card>

          <Card className="portal-card p-4 space-y-3 bg-bea-ivory-light/50">
            <div>
              <h3 className="portal-section-title text-sm">Pratinjau publik</h3>
              <p className="portal-section-desc mt-0.5">Tampilan modal yang donatur lihat di situs.</p>
            </div>
            <div className="rounded-2xl border border-bea-line bg-bea-ivory shadow-soft overflow-hidden">
              <div className="border-b border-bea-line px-4 py-3">
                <h4 className="font-serif text-base font-semibold text-bea-ink">Syarat & Ketentuan</h4>
                <p className="text-[11px] text-bea-sage mt-0.5">{SITE_ORG}</p>
              </div>
              <article className="max-h-56 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-bea-ink whitespace-pre-wrap">
                {termsDraft.text.trim() || (
                  <span className="text-bea-sage-muted italic">Belum ada teks — mulai ketik di editor.</span>
                )}
              </article>
              <div className="border-t border-bea-line px-4 py-2.5">
                <span className="bea-btn-primary block w-full min-h-9 text-center text-sm leading-9 pointer-events-none opacity-90">
                  Mengerti
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
