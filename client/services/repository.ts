import { get, post, patch } from './client';
import { FeedItem } from '../types/api';

export const repositoryApi = {
  submitRepo: (data: { githubRepoId: string; pitch?: string }) => 
    post<{ repositoryId: string }>('/repository', data),
    
  updatePitch: (data: { githubRepoId: string; pitch?: string }) => 
    patch<{ repositoryId: string }>('/repository/pitch', data),
    
  syncRepo: (id: string) => 
    post<{ stars: number; syncedAt: string }>(`/repository/${id}/sync`),
    
  getFeed: (cursor?: string, limit: number = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    
    return get<FeedItem[]>(`/repository/feed?${params.toString()}`);
  }
};
