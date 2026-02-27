import cron from 'node-cron';
import prisma from '../config/prisma.js';
import githubClient from '../utils/githubClient.js';
import logger from '../utils/logger.js';

// Sync 10 active repositories every 5 minutes
const startGithubSyncJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Starting GitHub Sync Job');
    try {
      // Find 10 repos, order by last updated so we cycle through all active
      const reposToSync = await prisma.repo.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { updatedAt: 'asc' }
      });

      for (const repo of reposToSync) {
        try {
          const response = await githubClient.get(`/repos/${repo.githubId}`);
          const latestStars = response.data.stargazers_count;

          if (latestStars !== repo.githubStars) {
            await prisma.repo.update({
              where: { id: repo.id },
              data: { githubStars: latestStars }
            });
            logger.info(`Synced repo ${repo.githubId}: ${repo.githubStars} -> ${latestStars}`);
          }
        } catch (apiErr) {
          logger.error(`Error syncing repo ${repo.githubId}: ${apiErr.message}`);
          // Consider marking repo inactive if 404
        }
      }
      logger.info('Completed GitHub Sync Job');
    } catch (err) {
      logger.error(`GitHub Sync Job failed: ${err.message}`);
    }
  });
};

export default startGithubSyncJob;
