import Redis from "ioredis";

// ---------------------------------------------------------------------------
// Cache interface – abstracts Redis vs in-memory so the app works even when
// Redis is not installed.
// ---------------------------------------------------------------------------
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  quit(): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory fallback (used when Redis is unavailable)
// ---------------------------------------------------------------------------
class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds = 1800): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    );
    const result: string[] = [];
    for (const [key, entry] of this.store) {
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) result.push(key);
    }
    return result;
  }

  async quit(): Promise<void> {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Redis wrapper
// ---------------------------------------------------------------------------
class RedisCache implements CacheClient {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on("error", (err) => {
      console.warn("⚠️ Redis error:", err.message);
    });
  }

  async connect(): Promise<boolean> {
    try {
      await this.client.connect();
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds = 1800): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}

// ---------------------------------------------------------------------------
// Singleton – tries Redis first, falls back to in-memory
// ---------------------------------------------------------------------------
let cacheInstance: CacheClient | null = null;
let cacheType: "redis" | "memory" = "memory";

export async function getCache(): Promise<CacheClient> {
  if (cacheInstance) return cacheInstance;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    const redis = new RedisCache(redisUrl);
    const ok = await redis.connect();
    if (ok) {
      console.log("✅ Redis cache connected");
      cacheInstance = redis;
      cacheType = "redis";
      return cacheInstance;
    }
    console.warn("⚠️ Redis unavailable, falling back to in-memory cache");
  } else {
    console.log("ℹ️ REDIS_URL not set, using in-memory cache");
  }

  cacheInstance = new MemoryCache();
  cacheType = "memory";
  return cacheInstance;
}

export function getCacheType(): "redis" | "memory" {
  return cacheType;
}
