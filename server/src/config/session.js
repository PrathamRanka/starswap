// src/config/session.js

import session from 'express-session';
import RedisStore from 'connect-redis';
import redisClient from './redis.js';
import { v4 as uuidv4 } from 'uuid';

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:'
});

const sessionConfig = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  genid: () => uuidv4(),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
});

export default sessionConfig;