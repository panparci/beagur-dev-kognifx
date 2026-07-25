import { useEffect, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { beaFieldLabel, beaInput, beaSelect, beaTextarea } from '@core/ui/beaTheme';
import { ADMIN_TASKS_TAB } from '@core/constants/tabs';
import { TaskAssignment, TaskTemplate, taskService } from '../../services/taskService';

export function AdminTasksTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const active = activeTab === ADMIN_TASKS_TAB;
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'ROUTINE' | 'ADHOC'>('ADHOC');
  const [fieldLabel, setFieldLabel] = useState('Konfirmasi sudah dikerjakan');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [subs, setSubs] = useState<TaskAssignment[]>([]);

  const reload = async () => setTemplates(await taskService.listTemplates());

  useEffect(() => {
    if (!active) return;
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat tugas'));
  }, [active]);

  const openSubs = async (templateId: string) => {
    setViewId(templateId);
    try {
      setSubs(await taskService.listAssignments(templateId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat kiriman');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await taskService.createTemplate({
        title: title.trim(),
        description: description.trim(),
        type,
        targetMode: 'ALL_TEACHERS',
        isActive: true,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        fields: [
          {
            id: 'f1',
            label: fieldLabel.trim() || 'Respons',
            type: type === 'ADHOC' ? 'DECLARATION' : 'TEXT',
            required: true,
          },
        ],
      });
      toast.success(`Tugas dibuat · ${res.assignedCount} guru ditugaskan`);
      setTitle('');
      setDescription('');
      setDueDate('');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat tugas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={showTab(activeTab, ADMIN_TASKS_TAB, 'fill')}>
      <PortalSectionHead
        title="Tugas & reminder guru"
        description="Kirim misi rutin atau ad-hoc ke guru yang sudah disetujui."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Buat tugas baru</h3>
          <label className="block">
            <span className={beaFieldLabel}>Judul</span>
            <input className={beaInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Deskripsi / reminder</span>
            <textarea className={beaTextarea} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Jenis</span>
            <select className={beaSelect} value={type} onChange={(e) => setType(e.target.value as 'ROUTINE' | 'ADHOC')}>
              <option value="ADHOC">Ad-hoc (sekali)</option>
              <option value="ROUTINE">Rutin bulanan</option>
            </select>
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Label field respons</span>
            <input className={beaInput} value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Tenggat (opsional — untuk uji terlambat)</span>
            <input
              className={beaInput}
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <Button onClick={() => void handleCreate()} disabled={loading}>
            {loading ? 'Menyimpan…' : 'Buat & tugaskan ke semua guru'}
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Daftar template</h3>
          {templates.length === 0 ? (
            <p className="text-sm text-bea-sage-muted">Belum ada tugas.</p>
          ) : (
            <ul className="space-y-3 max-h-[28rem] overflow-auto">
              {templates.map((t) => (
                <li key={t.id} className="rounded-lg border border-bea-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-bea-ink">{t.title}</p>
                      <p className="text-xs text-bea-sage-muted mt-1">
                        {t.type} · {t.assignedCount ?? 0} assignment · target {t.targetMode}
                      </p>
                    </div>
                    <Badge variant={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void openSubs(t.id)}>
                      Lihat kiriman
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void taskService
                          .setActive(t.id, !t.isActive)
                          .then(reload)
                          .then(() => toast.success(t.isActive ? 'Dinonaktifkan' : 'Diaktifkan ulang'))
                          .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal'))
                      }
                    >
                      {t.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {viewId ? (
        <Card className="mt-4 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-bea-ink">Kiriman assignment</h3>
            <Button size="sm" variant="secondary" onClick={() => setViewId(null)}>
              Tutup
            </Button>
          </div>
          {subs.length === 0 ? (
            <p className="text-sm text-bea-sage-muted">Belum ada assignment.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-auto text-sm">
              {subs.map((a) => (
                <li key={a.id} className="border-b border-bea-line py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-bea-ink">{a.teacherName || a.teacherUserId}</span>
                    <Badge variant={a.isLate ? 'danger' : a.status === 'SUBMITTED' ? 'success' : 'warning'}>
                      {a.isLate ? 'SUBMITTED (late)' : a.status}
                    </Badge>
                  </div>
                  {a.status === 'SUBMITTED' && (a.responses?.length ?? 0) > 0 ? (
                    <ul className="text-bea-sage-muted text-xs space-y-0.5">
                      {a.responses.map((r) => (
                        <li key={r.fieldId}>
                          {r.fieldId}: {r.value || '—'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-bea-sage-muted">Belum ada respons.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
