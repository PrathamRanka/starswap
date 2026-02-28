import 'dotenv/config';
import app from './app.js';
import startGithubSyncJob from './jobs/githubSync.job.js';
import startAbuseMonitorJob from './jobs/abuseMonitor.job.js';
import startLeaderboardRecalcJob from './jobs/leaderboardRecalc.job.js';
import logger from './utils/logger.js';


const PORT = process.env.PORT || 5000;
console.log("Redis_URL exists:", !!process.env.REDIS_URL);
console.log("Redis_URL value:", process.env.REDIS_URL);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL value:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize background jobs
  startGithubSyncJob();
  startAbuseMonitorJob();
  startLeaderboardRecalcJob();
});