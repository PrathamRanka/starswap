import { get } from './client';
import { LeaderboardEntry } from '../types/api';

export const leaderboardApi = {
  getLeaderboard: (limit: number = 50, period: string = 'alltime') => 
    // API Contract V1.md specifies period param
    get<LeaderboardEntry[]>(`/leaderboard?limit=${limit}&period=${period}`),
    
  getUserRank: (userId: string) => 
    get<{ rank: number }>(`/leaderboard/rank/${userId}`),
    
  getTopRepos: (limit: number = 20) => 
    get<TopRepo[]>(`/leaderboard/repos?limit=${limit}`)
};

export interface TopRepo {
  id: string;
  name: string;
  githubStars: number;
  pitch: string | null;
  language: string | null;
  url: string;
  rank: number;
  owner?: {
    username: string;
    avatarUrl?: string;
  }
}
