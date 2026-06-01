import "server-only";
import IORedis from "ioredis";

let redis: IORedis | null = null;

export const getRedis = (): IORedis | null => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
  }

  return redis;
};

export const ensureRedisConnected = async (client: IORedis): Promise<void> => {
  if (client.status === "ready" || client.status === "connecting" || client.status === "connect") {
    return;
  }
  await client.connect();
};
