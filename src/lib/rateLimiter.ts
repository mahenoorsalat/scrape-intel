// ============================================================
// ScrapeIntel — Rate Limiter
// ============================================================

/**
 * Simple delay-based rate limiter to avoid overwhelming target servers.
 */
export class RateLimiter {
  private delayMs: number;
  private lastRequestTime: number = 0;

  /**
   * @param delayMs — minimum milliseconds between requests (default 1500ms)
   */
  constructor(delayMs: number = 1500) {
    this.delayMs = delayMs;
  }

  /**
   * Wait until enough time has passed since the last request.
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remaining = this.delayMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Add a random jitter to the delay to appear more human-like.
   */
  async waitWithJitter(): Promise<void> {
    const jitter = Math.random() * 500; // 0-500ms extra
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remaining = this.delayMs - elapsed + jitter;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    this.lastRequestTime = Date.now();
  }
}
