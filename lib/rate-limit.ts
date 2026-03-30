import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const generateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:generate',
});

export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, '1 h'),
  prefix: 'ratelimit:chat',
});
