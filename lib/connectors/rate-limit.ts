import "server-only";
import { ensureRedisConnected, getRedis } from "@/lib/redis";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

export const assertRateLimit = async ({ key, limit, windowMs }: RateLimitOptions): Promise<void> => {
  const redis = getRedis();
  if (redis) {
    try {
      await ensureRedisConnected(redis);
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }
      if (count > limit) {
        throw new Error(`Rate limited: ${key}`);
      }
      return;
    } catch {
      // Fall back to in-memory rate limiting in demo mode.
    }
  }

  const now = Date.now();
  const current = memoryBuckets.get(key);
  if (!current || current.expiresAt <= now) {
    memoryBuckets.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new Error(`Rate limited: ${key}`);
  }
};
