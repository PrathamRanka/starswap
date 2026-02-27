import express from 'express';
import cors from 'cors';
import sessionConfig from './config/session.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_TEST
].filter(Boolean); // Filters out any undefined/empty variables

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

app.use(sessionConfig);

import authRoutes from './features/auth/auth.routes.js'
import swipeRoutes from './features/swipe/swipe.routes.js'
import leaderboardRoutes from './features/leaderboard/leaderboard.routes.js'
import repoRoutes from './features/repo/repo.routes.js'
import userRoutes from './features/user/user.routes.js'
import adminRoutes from './features/admin/admin.routes.js'

app.use('/auth', authRoutes)
app.use('/swipe', swipeRoutes)
app.use('/leaderboard', leaderboardRoutes)
app.use('/repository', repoRoutes)
app.use('/user', userRoutes)
app.use('/admin', adminRoutes)
app.use(errorMiddleware);

export default app;