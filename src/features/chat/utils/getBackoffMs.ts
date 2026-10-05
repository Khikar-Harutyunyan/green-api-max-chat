export const getBackoffMs = (consecutiveFailures: number): number =>
  Math.min(30_000, 1_000 * 2 ** (consecutiveFailures - 1));
