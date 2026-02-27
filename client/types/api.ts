export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    nextCursor?: string | null;
    [key: string]: unknown;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface User {
  id: string;
  githubId?: string;
  username: string;
  avatarUrl?: string;
  leaderboardScore: number;
  streakCount: number;
  starsGiven?: number;
  starsReceived?: number;
  role?: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface FeedItem {
  id: string;
  name: string;
  fullName?: string;
  pitch: string | null;
  description?: string | null;
  languages?: string[];
  githubStars: number;
  forks?: number;
  visibilityScore?: number;
  engagementScore?: number;
  owner?: {
    username: string;
    avatarUrl?: string;
  };
}

export interface LeaderboardEntry {
  rank?: number;
  id: string;
  username: string;
  avatar?: string;
  leaderboardScore: number;
  streak?: number;
  streakCount?: number;
}
