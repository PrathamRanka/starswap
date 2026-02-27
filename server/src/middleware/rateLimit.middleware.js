import redis from '../config/redis.js';

const rateLimit = (limit = 30, windowSeconds = 60) => {
  return async (req, res, next) => {
    const key = `rate:${req.session?.userId || req.ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests'
      });
    }

    next();
  };
};

export default rateLimit;