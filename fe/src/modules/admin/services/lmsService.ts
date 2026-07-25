import { apiGet, apiPost, apiPut } from '@core/api/client';

export type LmsLesson = {
  id: string;
  title: string;
  type: 'video' | 'article';
  youtubeId?: string;
  articleBody?: string;
  durationMin?: number;
};

export type LmsQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type LmsCourse = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  category: string;
  lessons: LmsLesson[];
  quiz: LmsQuizQuestion[];
  passScore: number;
  isPublished: boolean;
  createdAt: string;
};

export type LmsProgress = {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  quizScore?: number | null;
  quizAttempts: number;
  completedAt?: string | null;
  certificateNumber: string;
};

export type LiveSession = {
  id: string;
  title: string;
  host: string;
  description: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl: string;
  capacity: number;
  registeredUserIds: string[];
  registeredCount: number;
};

export const lmsService = {
  listCourses: (all = false) =>
    apiGet<LmsCourse[]>(all ? '/api/v1/lms/courses?all=1' : '/api/v1/lms/courses'),
  getCourse: (id: string) => apiGet<LmsCourse>(`/api/v1/lms/courses/${id}`),
  createCourse: (body: Partial<LmsCourse> & { title: string }) =>
    apiPost<LmsCourse>('/api/v1/admin/lms/courses', body),
  updateCourse: (id: string, body: Partial<LmsCourse> & { title: string }) =>
    apiPut<LmsCourse>(`/api/v1/admin/lms/courses/${id}`, body),
  myProgress: () => apiGet<LmsProgress[]>('/api/v1/lms/progress/mine'),
  saveProgress: (courseId: string, body: { completedLessonIds: string[]; quizScore?: number }) =>
    apiPost<LmsProgress>(`/api/v1/lms/courses/${courseId}/progress`, body),
  listSessions: () => apiGet<LiveSession[]>('/api/v1/lms/sessions'),
  createSession: (body: {
    title: string;
    host: string;
    description?: string;
    scheduledAt: string;
    durationMin?: number;
    meetingUrl: string;
    capacity?: number;
  }) => apiPost<LiveSession>('/api/v1/admin/lms/sessions', body),
  registerSession: (id: string) => apiPost<LiveSession>(`/api/v1/lms/sessions/${id}/register`, {}),
};
