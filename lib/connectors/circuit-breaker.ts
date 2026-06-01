import "server-only";

type CircuitState = {
  failures: number;
  openedUntil: number;
};

const circuits = new Map<string, CircuitState>();

export const withCircuitBreaker = async <T>(
  key: string,
  action: () => Promise<T>,
  options = { failureThreshold: 3, cooldownMs: 30_000 },
): Promise<T> => {
  const now = Date.now();
  const state = circuits.get(key);

  if (state && state.openedUntil > now) {
    throw new Error(`Circuit open: ${key}`);
  }

  try {
    const result = await action();
    circuits.set(key, { failures: 0, openedUntil: 0 });
    return result;
  } catch (error) {
    const previous = circuits.get(key) ?? { failures: 0, openedUntil: 0 };
    const failures = previous.failures + 1;
    circuits.set(key, {
      failures,
      openedUntil: failures >= options.failureThreshold ? now + options.cooldownMs : 0,
    });
    throw error;
  }
};
