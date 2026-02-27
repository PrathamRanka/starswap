import cron from 'node-cron';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { calculateLeaderboardScore, calculateVisibilityScore } from '../utils/scoring.js';

// Run every hour to ensure DB and Redis ZSET are perfectly synced and no scores drifted
const startLeaderboardRecalcJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting Leaderboard Recalculation Job');
    try {
      // 1. Recalculate User Leaderboards in Batches to prevent OOM
      const BATCH_SIZE = 500;
      let lastUserId = null;
      let hasMoreUsers = true;
      let totalUsersProcessed = 0;

      while (hasMoreUsers) {
        const userBatch = await prisma.user.findMany({
          where: { isBlocked: false, trustScore: { gt: 0 } },
          select: {
            id: true,
            starsGiven: true,
            streakCount: true,
            trustScore: true,
            reposOwned: {
              select: { githubStars: true } // Fixed: Use valid 'githubStars' field on Repo
            }
          },
          take: BATCH_SIZE,
          ...(lastUserId && { skip: 1, cursor: { id: lastUserId } }),
          orderBy: { id: 'asc' }
        });

        if (userBatch.length === 0) {
          hasMoreUsers = false;
          break;
        }

        const pipeline = redis.multi();
        const updatePromises = [];

        for (const user of userBatch) {
          // Correct calculation: Sum actual GitHub stars attached to your owned repos
          const totalReceived = user.reposOwned.reduce((sum, repo) => sum + repo.githubStars, 0);
          const ownerMock = { starsReceived: totalReceived };
          
          const newScore = calculateLeaderboardScore(user, ownerMock);

          // Batch inside an array to prevent N+1 execute queries
          updatePromises.push(
            prisma.user.update({
              where: { id: user.id },
              data: { leaderboardScore: newScore }
            })
          );

          pipeline.zAdd('leaderboard', {
            score: newScore,
            value: user.id
          });
        }

        // Commit all updates for the batch concurrently
        if (updatePromises.length > 0) {
          await prisma.$transaction(updatePromises);
        }
        await pipeline.exec();
        
        lastUserId = userBatch[userBatch.length - 1].id;
        totalUsersProcessed += userBatch.length;
      }
      
      // 2. Recalculate Feed Rank (Visibility Gravity Time-Decay) in Batches
      let lastRepoId = null;
      let hasMoreRepos = true;
      let totalReposProcessed = 0;

      while (hasMoreRepos) {
        const repoBatch = await prisma.repo.findMany({
          where: { isActive: true },
          select: { id: true, engagementScore: true, createdAt: true },
          take: BATCH_SIZE,
          ...(lastRepoId && { skip: 1, cursor: { id: lastRepoId } }),
          orderBy: { id: 'asc' }
        });

        if (repoBatch.length === 0) {
          hasMoreRepos = false;
          break;
        }

        const repoUpdatePromises = [];
        for (const repo of repoBatch) {
          const newVisibility = calculateVisibilityScore(repo.engagementScore, repo.createdAt);
          repoUpdatePromises.push(
            prisma.repo.update({
              where: { id: repo.id },
              data: { visibilityScore: newVisibility }
            })
          );
        }

        if (repoUpdatePromises.length > 0) {
          await prisma.$transaction(repoUpdatePromises);
        }

        lastRepoId = repoBatch[repoBatch.length - 1].id;
        totalReposProcessed += repoBatch.length;
      }

      logger.info(`Completed Recalc Job. Synced ${totalUsersProcessed} users, decayed ${totalReposProcessed} repos.`);
    } catch (err) {
      logger.error(`Leaderboard Recalc Job failed: ${err.message}`);
    }
  });
};

export default startLeaderboardRecalcJob;