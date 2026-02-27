import { get, post } from './client';
import { FeedItem } from '../types/api';

export const repositoryApi = {
  submitRepo: (data: { githubRepoId: string; pitch?: string }) => 
    post<{ repositoryId: string }>('/repo/submit', data),
    
  syncRepo: (id: string) => 
    post<{ stars: number; syncedAt: string }>(`/repository/${id}/sync`),
    
  getFeed: (cursor?: string, limit: number = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    
    // Explicitly aligned with GET /api/repo/feed defined in Frontend-Backend-Contract.md
    return get<{ feed: FeedItem[]; nextCursor: string | null }>(`/repo/feed?${params.toString()}`);
  }
};
