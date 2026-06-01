import { Worker } from "bullmq";
import IORedis from "ioredis";
import { callProvider } from "@/lib/connectors/base";
import type { Provider } from "@/lib/types";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required to run provider-sync-worker.");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

type SyncJob = {
  provider: Provider;
  requestedAt: string;
};

new Worker<SyncJob>(
  "provider-sync",
  async (job) => {
    const { provider } = job.data;

    return callProvider(
      {
        provider,
        endpoint: "scheduled_sync",
        accountRef: "demo-account",
      },
      async () => ({
        synced: true,
        provider,
        note: "Replace this demo fetcher with verified provider API responses after AS grants access.",
      }),
    );
  },
  { connection },
);
