import "server-only";
import { assertRateLimit } from "@/lib/connectors/rate-limit";
import { withCircuitBreaker } from "@/lib/connectors/circuit-breaker";
import type { Provider } from "@/lib/types";

export type ConnectorRequest = {
  provider: Provider;
  endpoint: string;
  accountRef: string;
  accessToken?: string;
};

export type ConnectorResponse<T> = {
  provider: Provider;
  endpoint: string;
  accountRef: string;
  receivedAt: string;
  data: T;
};

export const callProvider = async <T>(
  request: ConnectorRequest,
  fetcher: () => Promise<T>,
): Promise<ConnectorResponse<T>> => {
  const key = `${request.provider}:${request.accountRef}:${request.endpoint}`;
  await assertRateLimit({ key, limit: 60, windowMs: 60_000 });

  const data = await withCircuitBreaker(key, fetcher);
  return {
    provider: request.provider,
    endpoint: request.endpoint,
    accountRef: request.accountRef,
    receivedAt: new Date().toISOString(),
    data,
  };
};
