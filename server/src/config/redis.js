import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://'),
    rejectUnauthorized: false
  }
});


redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

await redisClient.connect();

console.log('Redis connected');

export default redisClient;