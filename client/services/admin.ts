import { get, post } from './client';

export const adminApi = {
  getAbuseLogs: (limit: number = 20, offset: number = 0) => 
    get<Record<string, unknown>[]>(`/admin/abuse-logs?limit=${limit}&offset=${offset}`),
    
  getFlaggedUsers: () => 
    get<Record<string, unknown>[]>('/admin/flagged-users'),
    
  blockUser: (id: string) => 
    post<{ isBlocked: boolean }>(`/admin/users/${id}/block`),
    
  resetTrust: (id: string) => 
    post<{ success: boolean }>(`/admin/users/${id}/reset-trust`)
};
