import { ragRepository } from '../../db/repositories';
import { RagDocument } from '../../types';

export const RAGService = {
  async indexDocument(_title: string, _content: string, _category: string, _tags: string[] = []): Promise<RagDocument> {
    throw new Error('Penambahan dokumen RAG melalui API belum diaktifkan.');
  },

  async searchRelevantDocs(query: string, topK: number = 2): Promise<RagDocument[]> {
    if (!query || query.trim() === '') {
      return ragRepository.getAll();
    }
    return ragRepository.search(query, topK);
  },

  async listAll(): Promise<RagDocument[]> {
    return ragRepository.getAll();
  },
};
