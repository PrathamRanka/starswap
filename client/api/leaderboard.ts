import { get } from './client';
import { LeaderboardEntry } from '../types/api';

export const leaderboardApi = {
  getLeaderboard: (limit: number = 50, period: string = 'alltime') => 
    // API Contract V1.md specifies period param
    get<LeaderboardEntry[]>(`/leaderboard?limit=${limit}&period=${period}`),
    
  getUserRank: (userId: string) => 
    get<{ rank: number }>(`/leaderboard/rank/${userId}`)
};
