import { post } from './client';

export const authApi = {
  loginWithGithub: (code: string) => post<{ success: boolean }>('/auth/github', { code }),
  logout: () => post<{ message: string }>('/auth/logout'),
};
