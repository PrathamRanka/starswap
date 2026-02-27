import express from 'express';
import sessionConfig from './config/session.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(sessionConfig);

import authRoutes from './features/auth/auth.routes.js'
import swipeRoutes from './features/swipe/swipe.routes.js'
import leaderboardRoutes from './features/leaderboard/leaderboard.routes.js'



app.use('/auth', authRoutes)
app.use('/swipe', swipeRoutes)
app.use('/leaderboard', leaderboardRoutes)


app.use(errorMiddleware);

export default app;