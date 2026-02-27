import 'dotenv/config';
import app from './app.js';
import startGithubSyncJob from './jobs/githubSync.job.js';
import startAbuseMonitorJob from './jobs/abuseMonitor.job.js';
import startLeaderboardRecalcJob from './jobs/leaderboardRecalc.job.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize background jobs
  startGithubSyncJob();
  startAbuseMonitorJob();
  startLeaderboardRecalcJob();
});