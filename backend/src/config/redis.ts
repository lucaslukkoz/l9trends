import Redis from 'ioredis';
import { env } from './env';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
});

redis.on('connect', () => {
  console.log('Redis client connected.');
});

redis.on('error', (error) => {
  console.log('Redis client error:', error.message);
});

export default redis;
