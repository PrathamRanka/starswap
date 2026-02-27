import { post } from './client';

export type SwipeType = 'STAR' | 'SKIP';

export const swipeApi = {
  submitSwipe: (repoId: string, type: SwipeType) => 
    post<{ swipe: { id: string }, newScore?: number }>('/swipe', { repoId, type })
};
