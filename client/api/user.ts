import { get } from './client';
import { User, FeedItem } from '../types/api';

export const userApi = {
  getMe: () => get<User>('/user/me'),
  getMyRepos: () => get<FeedItem[]>('/user/me/repos'),
  getUserProfile: (id: string) => get<User>(`/user/${id}`),
};
