import { apiPost } from '../../api/client';

type AiTextResponse = { text: string; modelUsed: string; sourceDocs?: string[] };

export const AIService = {
  async chatWithMemory(params: {
    userId: string;
    username: string;
    message: string;
    model?: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview';
    useRag?: boolean;
  }): Promise<{ text: string; modelUsed: string; sourceDocs?: string[] }> {
    const { message, model = 'gemini-3.5-flash', useRag = true } = params;
    return apiPost<AiTextResponse>('/api/v1/ai/chat', { message, model, useRag });
  },

  async assistWritingForm(params: {
    userId: string;
    username: string;
    jobTitle: string;
    yearsOfService: number;
    monthlySalary: number;
    draftReason: string;
  }): Promise<{ text: string; modelUsed: string }> {
    const { jobTitle, yearsOfService, monthlySalary, draftReason } = params;
    return apiPost<AiTextResponse>('/api/v1/ai/assist/form', {
      jobTitle,
      yearsOfService,
      monthlySalary,
      draftReason,
    });
  },

  async assistWritingReport(params: {
    userId: string;
    username: string;
    subject: string;
    studentProgress: string;
    supportBenefit: string;
  }): Promise<{ text: string; modelUsed: string }> {
    const { subject, studentProgress, supportBenefit } = params;
    return apiPost<AiTextResponse>('/api/v1/ai/assist/report', {
      subject,
      studentProgress,
      supportBenefit,
    });
  },

  async summarizeContent(params: {
    userId: string;
    username: string;
    content: string;
  }): Promise<{ text: string }> {
    const { content } = params;
    const result = await apiPost<AiTextResponse>('/api/v1/ai/summarize', { content });
    return { text: result.text };
  },
};
