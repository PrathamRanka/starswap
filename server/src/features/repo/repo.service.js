import repoRepository from './repo.repository.js';
import authRepository from '../auth/auth.repository.js';
import githubClient from '../../utils/githubClient.js';
import redis from '../../config/redis.js';
import prisma from '../../config/prisma.js';
import swipeService from '../swipe/swipe.service.js';

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

    // Get or create the actual GitHub repo owner as a User in our database
    let repoOwnerUserId;
    try {
      const ownerProfile = await githubClient.get(`/users/${githubData.owner.login}`);
      const ownerData = ownerProfile.data;
      
      const ownerUser = await prisma.user.upsert({
        where: { githubId: ownerData.id.toString() },
        update: {
          username: ownerData.login,
          name: ownerData.name,
          avatarUrl: ownerData.avatar_url
        },
        create: {
          githubId: ownerData.id.toString(),
          username: ownerData.login,
          name: ownerData.name,
          avatarUrl: ownerData.avatar_url
        }
      });
      repoOwnerUserId = ownerUser.id;
    } catch (err) {
      console.error('Failed to fetch or create repo owner:', err);
      throw new CustomError('Failed to process repository owner', 500);
    }

    const repoInput = {
      githubId: githubRepoId,
      ownerId: repoOwnerUserId,
      name: githubData.name,
      fullName: githubData.full_name,
      description: pitch || githubData.description || '',
      url: githubData.html_url,
      language: githubData.language,
      githubStars: githubData.stargazers_count,
      forks: githubData.forks_count,
      watchers: githubData.watchers_count,
      visibilityScore: 0,
      engagementScore: 0
    };

    try {
      const newRepo = await repoRepository.createRepo(repoInput);
      // Flush global feed caches so this new repo appears immediately
      try {
        const keys = await redis.keys('feed:cache:*');
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (e) {
        console.error('Failed to clear feed cache:', e);
      }
      
      return newRepo;
    } catch (dbErr) {
      if (dbErr.code === 'P2002') {
        throw new CustomError('Repository already submitted (conflict caught)', 409);
      }
      throw dbErr;
    }
  },

  async updatePitch(userId, githubRepoId, pitch) {
    const existing = await repoRepository.findRepoByGithubId(githubRepoId);
    if (!existing) {
      throw new CustomError('Repository not found', 404);
    }

    // Strictly enforce that only the true GitHub owner of the project can edit its pitch
    if (existing.ownerId !== userId) {
      throw new CustomError('Only the owner of this repository can edit its pitch.', 403);
    }

    const updatedRepo = await repoRepository.updateRepoPitchByGithubId(githubRepoId, pitch || '');

    // Reset Feed visibility: Delete all historical SwipeActions for this repository
    // so it re-appears in the Feed Generator queue for all users.
    try {
      await repoRepository.deleteAllSwipesByRepoId(existing.id);
    } catch (e) {
      console.error('Failed to purge historical swipes during pitch update:', e);
    }

    // Flush feed caches so the new pitch propagates
    try {
      const keys = await redis.keys('feed:cache:*');
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (e) {
      console.error('Failed to clear feed cache:', e);
    }

    return updatedRepo;
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
    // Fire-and-forget background worker to purge un-starred repos from the local database
    swipeService.syncStaleSwipes(userId).catch(e => console.error('[Background Sync Error]', e.message));

    const cacheKey = `feed:cache:${userId}:${cursorId || 'start'}`;
    
    let repos = null;
    let cachedFeed = null;
    
    try {
      cachedFeed = await redis.get(cacheKey);
    } catch (redisErr) {
      console.warn(`[Redis Fallback] Failed to GET cache for ${cacheKey}`, redisErr.message);
    }

    if (cachedFeed) {
      try {
        repos = JSON.parse(cachedFeed);
      } catch (e) {
        console.warn(`[Redis Fallback] Failed to parse cached payload`, e.message);
      }
    } 
    
    if (!repos) {
      repos = await repoRepository.getFeed(userId, limit, null, cursorId);
      if (repos && repos.length > 0) {
        try {
          await redis.set(cacheKey, JSON.stringify(repos), { EX: 60 });
        } catch (redisErr) {
          console.warn(`[Redis Fallback] Failed to SET cache for ${cacheKey}`, redisErr.message);
        }
      } else {
        repos = [];
      }
    }

    const shuffled = [...repos];
    for (let i = shuffled.length - 1; i > 0; i--) {
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
