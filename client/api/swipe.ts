import { post } from './client';

export const swipeApi = {
  submitSwipe: (repoId: string, decision: 'LEFT' | 'RIGHT') => 
    post<{ updatedScore?: number; streak?: number; swipeId?: string }>('/swipe', { repoId, decision })
};
