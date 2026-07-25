import { useEffect, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { beaFieldLabel, beaInput, beaTextarea } from '@core/ui/beaTheme';
import { ADMIN_LMS_TAB } from '@core/constants/tabs';
import { LmsCourse, LiveSession, lmsService } from '../../services/lmsService';

export function AdminLmsTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const active = activeTab === ADMIN_LMS_TAB;
  const [courses, setCourses] = useState<LmsCourse[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pedagogi');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionHost, setSessionHost] = useState('Yayasan Bea Guru');
  const [sessionAt, setSessionAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/');
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const [c, s] = await Promise.all([lmsService.listCourses(true), lmsService.listSessions()]);
    setCourses(c);
    setSessions(s);
  };

  useEffect(() => {
    if (!active) return;
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat LMS'));
  }, [active]);

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast.error('Judul kursus wajib');
      return;
    }
    setLoading(true);
    try {
      await lmsService.createCourse({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'Umum',
        coverUrl: '',
        passScore: 70,
        isPublished: true,
        lessons: [
          {
            id: `l-${Date.now()}`,
            title: 'Materi pembuka',
            type: 'article',
            articleBody: description.trim() || 'Pelajari materi ini lalu lanjut ke kuis.',
            durationMin: 10,
          },
        ],
        quiz: [
          {
            id: `q-${Date.now()}`,
            prompt: 'Apakah Anda sudah membaca materi?',
            options: ['Belum', 'Sudah'],
            correctIndex: 1,
          },
        ],
      });
      toast.success('Kursus dipublikasikan');
      setTitle('');
      setDescription('');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat kursus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !sessionAt) {
      toast.error('Judul dan jadwal wajib');
      return;
    }
    setLoading(true);
    try {
      await lmsService.createSession({
        title: sessionTitle.trim(),
        host: sessionHost.trim() || 'Yayasan',
        scheduledAt: new Date(sessionAt).toISOString(),
        meetingUrl: meetingUrl.trim(),
        capacity: 50,
      });
      toast.success('Sesi live dibuat');
      setSessionTitle('');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat sesi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={showTab(activeTab, ADMIN_LMS_TAB, 'fill')}>
      <PortalSectionHead
        title="Kelola pelatihan online"
        description="Kursus mandiri dan sesi live mentoring untuk guru."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Kursus baru</h3>
          <label className="block">
            <span className={beaFieldLabel}>Judul</span>
            <input className={beaInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Kategori</span>
            <input className={beaInput} value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Deskripsi</span>
            <textarea className={beaTextarea} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <Button onClick={() => void handleCreateCourse()} disabled={loading}>
            Publikasikan kursus
          </Button>
          <ul className="space-y-2 pt-2 max-h-48 overflow-auto">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm border-b border-bea-line py-2">
                <span>{c.title}</span>
                <Badge variant={c.isPublished ? 'success' : 'neutral'}>
                  {c.isPublished ? 'Published' : 'Draft'} · {c.lessons.length} pelajaran
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Sesi live</h3>
          <label className="block">
            <span className={beaFieldLabel}>Judul sesi</span>
            <input className={beaInput} value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Host</span>
            <input className={beaInput} value={sessionHost} onChange={(e) => setSessionHost(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Jadwal</span>
            <input className={beaInput} type="datetime-local" value={sessionAt} onChange={(e) => setSessionAt(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Meeting URL</span>
            <input className={beaInput} value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
          </label>
          <Button onClick={() => void handleCreateSession()} disabled={loading}>
            Buat sesi
          </Button>
          <ul className="space-y-2 pt-2 max-h-48 overflow-auto">
            {sessions.map((s) => (
              <li key={s.id} className="text-sm border-b border-bea-line py-2">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-bea-sage-muted">
                  {new Date(s.scheduledAt).toLocaleString('id-ID')} · {s.registeredCount}/{s.capacity} daftar
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
