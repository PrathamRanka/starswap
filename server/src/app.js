import express from 'express';
import cors from 'cors';
import sessionConfig from './config/session.js';
import errorMiddleware from './middleware/error.middleware.js';
import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1);
if (!process.env.FRONTEND_URL) {
  console.error('[FATAL] FRONTEND_URL environment variable is missing.');
  process.exit(1);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_TEST
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Crucial for sending secure HttpOnly session cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this IP.' } }
});
app.use(globalLimiter);

app.use(sessionConfig);

import authRoutes from './features/auth/auth.routes.js'
import swipeRoutes from './features/swipe/swipe.routes.js'
import leaderboardRoutes from './features/leaderboard/leaderboard.routes.js'
import repoRoutes from './features/repo/repo.routes.js'
import userRoutes from './features/user/user.routes.js'
import adminRoutes from './features/admin/admin.routes.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/swipe', swipeRoutes)
app.use('/api/v1/leaderboard', leaderboardRoutes)
app.use('/api/v1/repository', repoRoutes)
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use(errorMiddleware);

export default app;