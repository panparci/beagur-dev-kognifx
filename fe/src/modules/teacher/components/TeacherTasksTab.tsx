import { useEffect, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { beaFieldLabel, beaInput } from '@core/ui/beaTheme';
import { TEACHER_TASKS_TAB } from '@core/constants/tabs';
import { TaskAssignment, taskService } from '@modules/admin/services/taskService';

export function TeacherTasksTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const active = activeTab === TEACHER_TASKS_TAB;
  const [items, setItems] = useState<TaskAssignment[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => setItems(await taskService.listMine());

  useEffect(() => {
    if (!active) return;
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat tugas'));
  }, [active]);

  const submit = async (item: TaskAssignment) => {
    const fields = item.fields ?? [];
    const responses = fields.map((f) => ({
      fieldId: f.id,
      value: drafts[`${item.id}:${f.id}`] ?? (f.type === 'DECLARATION' ? 'Ya' : ''),
    }));
    const missing = fields.filter((f) => f.required && !responses.find((r) => r.fieldId === f.id)?.value.trim());
    if (missing.length) {
      toast.error('Lengkapi semua field wajib');
      return;
    }
    setBusyId(item.id);
    try {
      await taskService.submit(item.id, responses);
      toast.success('Tugas dikirim');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengirim');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={showTab(activeTab, TEACHER_TASKS_TAB, 'fill')}>
      <PortalSectionHead
        title="Tugas & misi yayasan"
        description="Reminder dan misi dari admin. Kerjakan sebelum tenggat."
      />
      {items.length === 0 ? (
        <Card className="p-6 text-sm text-bea-sage-muted">Belum ada tugas untuk Anda.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-bea-ink">{item.title}</h3>
                  <p className="text-sm text-bea-sage-muted mt-1">{item.description}</p>
                  {item.dueAt ? (
                    <p className="text-xs text-bea-sage-muted mt-1">
                      Tenggat: {new Date(item.dueAt).toLocaleString('id-ID')}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    item.status === 'SUBMITTED' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'warning'
                  }
                >
                  {item.status}
                </Badge>
              </div>

              {item.status === 'SUBMITTED' ? (
                <p className="text-sm text-bea-sage-muted">Sudah dikirim. Terima kasih.</p>
              ) : (
                <>
                  {(item.fields ?? []).map((field) => (
                    <label key={field.id} className="block">
                      <span className={beaFieldLabel}>{field.label}</span>
                      <input
                        className={beaInput}
                        value={drafts[`${item.id}:${field.id}`] ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [`${item.id}:${field.id}`]: e.target.value }))
                        }
                        placeholder={field.type === 'DECLARATION' ? 'Ketik Ya untuk konfirmasi' : 'Isi respons'}
                      />
                    </label>
                  ))}
                  <Button disabled={busyId === item.id} onClick={() => void submit(item)}>
                    {busyId === item.id ? 'Mengirim…' : 'Kirim tugas'}
                  </Button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
