import cron from 'node-cron';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import redisClient from '../config/redis.js';

// Runs once a day at midnight
const startAbuseMonitorJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const lockKey = 'job:lock:abuseMonitor';
      const acquired = await redisClient.set(lockKey, 'locked', { EX: 3600, NX: true });
      if (!acquired) {
        logger.info('Abuse Monitor Job is already running on another instance. Skipping.');
        return;
      }
      
      logger.info('Starting Abuse Monitor Job');
      // Identify anomalies: e.g., users with high streaks but 0 stars received/repos 
      // This flags potential bots just farming left-swipes
      
      const suspiciousUsers = await prisma.user.findMany({
        where: {
          streakCount: { gt: 10 },
          reposOwned: { none: {} },
          starsReceived: 0,
          trustScore: { gt: 0.5 }
        },
        take: 50
      });

      for (const user of suspiciousUsers) {
        // Soft drop trust score by 10% daily if flagged
        const newTrust = Math.max(0.1, user.trustScore * 0.9);
        await prisma.user.update({
          where: { id: user.id },
          data: { trustScore: newTrust }
        });

        await prisma.abuseLog.create({
          data: {
            userId: user.id,
            reason: 'Automated abuse monitor: Bot-like streak detected',
            severity: 0.1
          }
        });
        
        logger.info(`Abuse Monitor flagged user ${user.id}, trust score reduced to ${newTrust.toFixed(2)}`);
      }
      
      logger.info(`Completed Abuse Monitor Job. Flagged ${suspiciousUsers.length} users.`);
    } catch (err) {
      logger.error(`Abuse Monitor Job failed: ${err.message}`);
    }
  });
};

export default startAbuseMonitorJob;
