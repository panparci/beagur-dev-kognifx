import { apiGet, apiPatch, apiPost } from '@core/api/client';

export type TaskFormField = {
  id: string;
  label: string;
  type: 'TEXT' | 'PHOTO' | 'DECLARATION';
  required: boolean;
};

export type TaskTemplate = {
  id: string;
  title: string;
  description: string;
  type: 'ROUTINE' | 'ADHOC';
  recurrence: string;
  targetMode: 'ALL_TEACHERS' | 'SPECIFIC_INSTITUTIONS' | 'SPECIFIC_TEACHERS';
  targetInstitutionIds: string[];
  targetTeacherProfileIds: string[];
  fields: TaskFormField[];
  dueDate?: string | null;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  assignedCount?: number;
};

export type TaskAssignment = {
  id: string;
  templateId: string;
  teacherProfileId: string;
  teacherUserId: string;
  period: string;
  status: 'PENDING' | 'SUBMITTED' | 'OVERDUE';
  assignedAt: string;
  dueAt?: string | null;
  submittedAt?: string | null;
  responses: { fieldId: string; value: string }[];
  title?: string;
  description?: string;
  fields?: TaskFormField[];
};

export const taskService = {
  listTemplates: () => apiGet<TaskTemplate[]>('/api/v1/admin/tasks/templates'),
  createTemplate: (body: {
    title: string;
    description: string;
    type: 'ROUTINE' | 'ADHOC';
    targetMode?: string;
    fields: TaskFormField[];
    isActive?: boolean;
  }) => apiPost<{ template: TaskTemplate; assignedCount: number }>('/api/v1/admin/tasks/templates', body),
  setActive: (id: string, isActive: boolean) =>
    apiPatch<{ template: TaskTemplate; assignedCount: number }>(`/api/v1/admin/tasks/templates/${id}`, { isActive }),
  listAssignments: (templateId?: string) =>
    apiGet<TaskAssignment[]>(
      templateId
        ? `/api/v1/admin/tasks/assignments?templateId=${encodeURIComponent(templateId)}`
        : '/api/v1/admin/tasks/assignments',
    ),
  listMine: () => apiGet<TaskAssignment[]>('/api/v1/tasks/mine'),
  submit: (id: string, responses: { fieldId: string; value: string }[]) =>
    apiPost<TaskAssignment>(`/api/v1/tasks/assignments/${id}/submit`, { responses }),
};
