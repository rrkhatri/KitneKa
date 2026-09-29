/**
 * Small in-process TTL cache with stale-while-revalidate semantics.
 *
 * Deliberately not Redis. It is a single Map with an LRU bound, which is the
 * right size for one Node process and keeps the app runnable with no external
 * dependency. The interface is async so swapping in Redis later is a drop-in
 * change: keep the same get/set signature and move the body out of memory.
 *
 * Behaviour that matters for a price comparison:
 *  - fresh  (< ttlMs)      -> return immediately
 *  - stale  (< staleMs)    -> return the cached value AND refresh in the
 *                             background, so a slow upstream never blocks a page
 *  - expired               -> block on the refresh
 *  - refresh throws        -> serve the stale value if we have one, so a feed
 *                             outage degrades rather than errors
 */

type Entry<T> = {
  value: T;
  storedAt: number;
  refreshing?: Promise<void>;
};

export type CacheStats = {
  hits: number;
  staleHits: number;
  misses: number;
  sets: number;
  evictions: number;
};

export class TtlCache {
  private store = new Map<string, Entry<unknown>>();
  private stats: CacheStats = { hits: 0, staleHits: 0, misses: 0, sets: 0, evictions: 0 };

  constructor(
    private readonly maxEntries = 1000,
    private readonly ttlMs = 60_000,
    private readonly staleMs = 15 * 60_000,
  ) {}

  private evictIfNeeded() {
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) return;
      this.store.delete(oldest.value);
      this.stats.evictions++;
    }
  }

  /** Wrap a potentially-throwing loader. Never throws if a stale value exists. */
  async wrap<T>(key: string, loader: () => Promise<T>): Promise<{ value: T; cacheStatus: 'hit' | 'stale' | 'miss' }> {
    const now = Date.now();
    const entry = this.store.get(key) as Entry<T> | undefined;

    if (entry) {
      const age = now - entry.storedAt;

      if (age < this.ttlMs) {
        this.stats.hits++;
        return { value: entry.value, cacheStatus: 'hit' };
      }

      if (age < this.staleMs) {
        this.stats.staleHits++;
        this.refresh(key, loader);
        return { value: entry.value, cacheStatus: 'stale' };
      }
    }

    this.stats.misses++;
    try {
      const value = await loader();
      this.set(key, value);
      return { value, cacheStatus: 'miss' };
    } catch (err) {
      if (entry) {
        // The refresh failed but we have something better than an error page.
        this.refresh(key, loader);
        return { value: entry.value, cacheStatus: 'stale' };
      }
      throw err;
    }
  }

  /** Fire-and-forget background refresh, de-duplicated per key. */
  private refresh<T>(key: string, loader: () => Promise<T>) {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (entry?.refreshing) return;

    const task = loader()
      .then((value) => {
        this.set(key, value);
      })
      .catch(() => {
        /* keep serving the stale value; the next request will retry */
      })
      .finally(() => {
        const current = this.store.get(key) as Entry<T> | undefined;
        if (current) current.refreshing = undefined;
      });

    const current = this.store.get(key) as Entry<T> | undefined;
    if (current) current.refreshing = task;
  }

  private set<T>(key: string, value: T) {
    this.store.set(key, { value, storedAt: Date.now() });
    this.stats.sets++;
    this.evictIfNeeded();
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}
