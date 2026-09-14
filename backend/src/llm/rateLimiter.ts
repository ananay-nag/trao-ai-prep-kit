/**
 * Simple token bucket / delay rate-limiter with exponential backoff & jitter for 429 retries.
 */
export async function withRetryAndBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    description?: string;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 4;
  const initialDelayMs = options.initialDelayMs ?? 1500;
  const maxDelayMs = options.maxDelayMs ?? 15000;
  const desc = options.description ?? 'LLM Call';

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const isRateLimit =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('rate limit') ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('resource_exhausted');

      const isServerTransient =
        error?.status >= 500 ||
        error?.message?.includes('503') ||
        error?.message?.includes('ECONNRESET');

      if ((isRateLimit || isServerTransient) && attempt <= maxRetries) {
        // Add random jitter (±20%)
        const jitter = delay * (0.8 + Math.random() * 0.4);
        console.warn(
          `⚠️ [RateLimit/Transient] ${desc} attempt ${attempt}/${maxRetries} failed with ${error.message}. Backing off for ${Math.round(jitter)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, jitter));
        delay = Math.min(delay * 2, maxDelayMs);
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed ${desc} after ${maxRetries} retries.`);
}
