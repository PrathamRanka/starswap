import cron from 'node-cron';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { calculateLeaderboardScore } from '../utils/scoring.js';

// Run every hour to ensure DB and Redis ZSET are perfectly synced and no scores drifted
const startLeaderboardRecalcJob = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting Leaderboard Recalculation Job');
    try {
      const allUsers = await prisma.user.findMany({
        where: { isBlocked: false, trustScore: { gt: 0 } },
        select: {
          id: true,
          starsGiven: true,
          streakCount: true,
          trustScore: true,
          reposOwned: {
            select: { starsReceived: true }
          }
        }
      });

      const pipeline = redis.multi();

      for (const user of allUsers) {
        // Mocking owner object to aggregate total stars received across all repos 
        // to pass into scoring utility.
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
      logger.info(`Completed Leaderboard Recalculation Job. Synced ${allUsers.length} users.`);
    } catch (err) {
      logger.error(`Leaderboard Recalc Job failed: ${err.message}`);
    }
  });
};

export default startLeaderboardRecalcJob;