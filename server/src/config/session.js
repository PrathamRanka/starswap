// src/config/session.js

import session from 'express-session';
import {RedisStore} from 'connect-redis';
import redisClient from './redis.js';
import { v4 as uuidv4 } from 'uuid';

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:'
});
const isProd = process.env.NODE_ENV === "production";

const sessionConfig = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  genid: () => uuidv4(),
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
});

export default sessionConfig;