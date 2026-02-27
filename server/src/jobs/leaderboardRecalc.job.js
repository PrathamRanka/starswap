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
      let userSkip = 0;
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
              select: { starsReceived: true }
            }
          },
          take: BATCH_SIZE,
          skip: userSkip
        });

        if (userBatch.length === 0) {
          hasMoreUsers = false;
          break;
        }

        const pipeline = redis.multi();

        for (const user of userBatch) {
          const totalReceived = user.reposOwned.reduce((sum, repo) => sum + repo.starsReceived, 0);
          const ownerMock = { starsReceived: totalReceived };
          
          const newScore = calculateLeaderboardScore(user, ownerMock);

          await prisma.user.update({
            where: { id: user.id },
            data: { leaderboardScore: newScore }
          });

          pipeline.zAdd('leaderboard', {
            score: newScore,
            value: user.id
          });
        }

        await pipeline.exec();
        
        userSkip += BATCH_SIZE;
        totalUsersProcessed += userBatch.length;
      }
      
      // 2. Recalculate Feed Rank (Visibility Gravity Time-Decay) in Batches
      let repoSkip = 0;
      let hasMoreRepos = true;
      let totalReposProcessed = 0;

      while (hasMoreRepos) {
        const repoBatch = await prisma.repo.findMany({
          where: { isActive: true },
          select: { id: true, engagementScore: true, createdAt: true },
          take: BATCH_SIZE,
          skip: repoSkip
        });

        if (repoBatch.length === 0) {
          hasMoreRepos = false;
          break;
        }

        for (const repo of repoBatch) {
          const newVisibility = calculateVisibilityScore(repo.engagementScore, repo.createdAt);
          await prisma.repo.update({
            where: { id: repo.id },
            data: { visibilityScore: newVisibility }
          });
        }

        repoSkip += BATCH_SIZE;
        totalReposProcessed += repoBatch.length;
      }

      logger.info(`Completed Recalc Job. Synced ${totalUsersProcessed} users, decayed ${totalReposProcessed} repos.`);
    } catch (err) {
      logger.error(`Leaderboard Recalc Job failed: ${err.message}`);
    }
  });
};

export default startLeaderboardRecalcJob;