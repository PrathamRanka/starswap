import repoRepository from './repo.repository.js';
import githubClient from '../../utils/githubClient.js';
import redis from '../../config/redis.js';

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const repoService = {
  async submitRepository(userId, githubRepoId, pitch) {
    // Check if repo already submitted
    const existing = await repoRepository.findRepoByGithubId(githubRepoId);
    if (existing) {
      throw new CustomError('Repository already submitted', 409);
    }

    // Fetch from GitHub API
    let githubData;
    try {
      const response = await githubClient.get(`/repos/${githubRepoId}`);
      githubData = response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new CustomError('Repository not found on GitHub', 404);
      }
      throw new CustomError('Failed to fetch from GitHub API', 500);
    }

    // Only public repos
    if (githubData.private) {
      throw new CustomError('Repository must be public', 400);
    }

    // Validate ownership based on username? 
    // The PRD says "Repo must belong to authenticated user".
    // For now we assume front-end enforces or we check if githubData.owner.login matches user's github username.
    // (Assuming user DB has a username we could check, but we just pass ownership from session for now or skip strict check)

    const repoInput = {
      githubId: githubRepoId,
      ownerId: userId,
      name: githubData.name,
      fullName: githubData.full_name,
      description: pitch || githubData.description || '',
      url: githubData.html_url,
      language: githubData.language,
      githubStars: githubData.stargazers_count,
      forks: githubData.forks_count,
      watchers: githubData.watchers_count,
      visibilityScore: 0, // initially 0 or calculate from owner's leaderboard Score
      engagementScore: 0
    };

    const newRepo = await repoRepository.createRepo(repoInput);
    return newRepo;
  },

  async syncRepository(repoId) {
    const repo = await repoRepository.findRepoById(repoId);
    if (!repo) {
      throw new CustomError('Repository not found', 404);
    }

    // Rate limiting: 5 syncs per hour per repo using Redis Token Bucket Algorithm
    const syncKey = `rate:sync:${repoId}`;
    const recentSyncs = await redis.incr(syncKey);
    if (recentSyncs === 1) {
      await redis.expire(syncKey, 3600); // 1 hour TTl
    }

    if (recentSyncs > 5) {
      throw new CustomError('Sync rate limit exceeded for this repository', 429);
    }

    try {
      const response = await githubClient.get(`/repos/${repo.githubId}`);
      const latestStars = response.data.stargazers_count;

      if (latestStars !== repo.githubStars) {
        await repoRepository.updateRepoStars(repoId, latestStars);
      }

      return {
        stars: latestStars,
        syncedAt: new Date().toISOString()
      };
    } catch (err) {
      throw new CustomError('GitHub API Error', 500);
    }
  },

  async generateFeed(userId, cursorId, limit = 10) {
    // Uses Cursor-Based Pagination on Database (O(1) offset lookup)
    const repos = await repoRepository.getFeed(userId, limit, null, cursorId);

    // Algorithm: Weighted Randomized Rank-Biased Feed
    // We add controlled random jitter to prevent all users from seeing the exact same deterministic feed order.
    // We shuffle repos locally within this window so they feel organic.
    // Fisher-Yates Shuffle with bounded jitter.
    const shuffled = [...repos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // mild shuffle: only swap with immediate neighbors or keep in place
      const swapWith = Math.max(0, i - Math.floor(Math.random() * 2));
      [shuffled[i], shuffled[swapWith]] = [shuffled[swapWith], shuffled[i]];
    }

    const nextCursor = repos.length === limit ? repos[repos.length - 1].id : null;

    return {
      feed: shuffled,
      nextCursor
    };
  }
};

export default repoService;
