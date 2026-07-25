import { useEffect, useMemo, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { TEACHER_TRAINING_TAB } from '@core/constants/tabs';
import {
  LmsCourse,
  LmsProgress,
  LiveSession,
  lmsService,
} from '@modules/admin/services/lmsService';
import { useAuth } from '@modules/auth/hooks/useAuth';

export function TeacherTrainingTab() {
  const { activeTab } = usePortalNav();
  const { user } = useAuth();
  const toast = useToast();
  const active = activeTab === TEACHER_TRAINING_TAB;
  const [courses, setCourses] = useState<LmsCourse[]>([]);
  const [progress, setProgress] = useState<LmsProgress[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const progressByCourse = useMemo(() => {
    const map = new Map<string, LmsProgress>();
    for (const p of progress) map.set(p.courseId, p);
    return map;
  }, [progress]);

  const reload = async () => {
    const [c, p, s] = await Promise.all([
      lmsService.listCourses(false),
      lmsService.myProgress(),
      lmsService.listSessions(),
    ]);
    setCourses(c);
    setProgress(p);
    setSessions(s);
  };

  useEffect(() => {
    if (!active) return;
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat pelatihan'));
  }, [active]);

  const openCourse = courses.find((c) => c.id === openId) ?? null;
  const openProgress = openId ? progressByCourse.get(openId) : undefined;

  const completeLesson = async (course: LmsCourse, lessonId: string) => {
    const done = new Set(openProgress?.completedLessonIds ?? []);
    done.add(lessonId);
    setBusy(true);
    try {
      await lmsService.saveProgress(course.id, { completedLessonIds: [...done] as string[] });
      await reload();
      toast.success('Pelajaran ditandai selesai');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  };

  const submitQuiz = async (course: LmsCourse) => {
    if (course.quiz.length === 0) return;
    let correct = 0;
    for (const q of course.quiz) {
      if (answers[q.id] === q.correctIndex) correct += 1;
    }
    const score = Math.round((correct / course.quiz.length) * 100);
    const done = openProgress?.completedLessonIds ?? course.lessons.map((l) => l.id);
    setBusy(true);
    try {
      const saved = await lmsService.saveProgress(course.id, { completedLessonIds: done, quizScore: score });
      await reload();
      if (saved.certificateNumber) {
        toast.success(`Lulus! Sertifikat: ${saved.certificateNumber}`);
      } else {
        toast.success(`Skor kuis: ${score}. Minimal ${course.passScore} untuk lulus.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal submit kuis');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={showTab(activeTab, TEACHER_TRAINING_TAB, 'fill')}>
      <PortalSectionHead
        title="Pelatihan pedagogi"
        description="Kursus mandiri dan sesi live dari yayasan."
      />

      {openCourse ? (
        <Card className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg text-bea-ink">{openCourse.title}</h3>
              <p className="text-sm text-bea-sage-muted mt-1">{openCourse.description}</p>
            </div>
            <Button variant="secondary" onClick={() => setOpenId(null)}>
              Kembali
            </Button>
          </div>

          {openProgress?.certificateNumber ? (
            <Badge variant="success">Sertifikat: {openProgress.certificateNumber}</Badge>
          ) : null}

          <div className="space-y-3">
            <h4 className="font-medium">Pelajaran</h4>
            {openCourse.lessons.map((lesson) => {
              const done = openProgress?.completedLessonIds?.includes(lesson.id);
              return (
                <div key={lesson.id} className="rounded-lg border border-bea-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{lesson.title}</p>
                    <Badge variant={done ? 'success' : 'neutral'}>{done ? 'Selesai' : 'Belum'}</Badge>
                  </div>
                  {lesson.type === 'article' ? (
                    <p className="text-sm text-bea-ink/80 mt-2 whitespace-pre-wrap">{lesson.articleBody}</p>
                  ) : lesson.youtubeId ? (
                    <a
                      className="text-sm text-bea-copper underline mt-2 inline-block"
                      href={`https://www.youtube.com/watch?v=${lesson.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buka video YouTube
                    </a>
                  ) : null}
                  {!done ? (
                    <div className="mt-2">
                      <Button size="sm" disabled={busy} onClick={() => void completeLesson(openCourse, lesson.id)}>
                        Tandai selesai
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {openCourse.quiz.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium">Kuis (lulus ≥ {openCourse.passScore})</h4>
              {openCourse.quiz.map((q) => (
                <div key={q.id} className="rounded-lg border border-bea-line p-3 space-y-2">
                  <p className="text-sm font-medium">{q.prompt}</p>
                  {q.options.map((opt, idx) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === idx}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}
              <Button disabled={busy} onClick={() => void submitQuiz(openCourse)}>
                Kirim kuis
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((course) => {
              const p = progressByCourse.get(course.id);
              return (
                <Card key={course.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-bea-ink">{course.title}</h3>
                    <Badge variant="neutral">{course.category}</Badge>
                  </div>
                  <p className="text-sm text-bea-sage-muted line-clamp-3">{course.description}</p>
                  <p className="text-xs text-bea-sage-muted">
                    {course.lessons.length} pelajaran
                    {p?.certificateNumber ? ` · Sertifikat ${p.certificateNumber}` : ''}
                  </p>
                  <Button onClick={() => setOpenId(course.id)}>Buka kursus</Button>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-bea-ink mb-3">Sesi live</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-bea-sage-muted">Belum ada sesi terjadwal.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const registered = user?.id ? s.registeredUserIds.includes(user.id) : false;
                  return (
                    <Card key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-bea-sage-muted">
                          {s.host} · {new Date(s.scheduledAt).toLocaleString('id-ID')} · {s.registeredCount}/
                          {s.capacity}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {registered ? (
                          <a href={s.meetingUrl} target="_blank" rel="noreferrer">
                            <Button size="sm">Join meeting</Button>
                          </a>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              void lmsService
                                .registerSession(s.id)
                                .then(reload)
                                .then(() => toast.success('Terdaftar di sesi'))
                                .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal daftar'))
                            }
                          >
                            Daftar
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
