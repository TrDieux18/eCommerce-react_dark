import Redis from "ioredis";

// ---------------------------------------------------------------------------
// Cache interface
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
// In-memory fallback
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
// Valkey client implementation
// ---------------------------------------------------------------------------
class ValkeyCache implements CacheClient {
   private client: Redis;

   constructor(url: string) {
      this.client = new Redis(url, {
         maxRetriesPerRequest: 1,
         connectTimeout: 2000,
         reconnectOnError: () => false,
      });
      
      this.client.on("error", (err) => {
         // Silently catch runtime connection errors
         // Console warnings will be printed when trying to perform operations if connection is dead
      });
   }

   async ping(): Promise<string> {
      return this.client.ping();
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
// Singleton Connection Manager
// ---------------------------------------------------------------------------
let cacheInstance: CacheClient | null = null;
let cacheType: "valkey" | "memory" = "memory";

export async function getCache(): Promise<CacheClient> {
   if (cacheInstance) return cacheInstance;

   const valkeyUrl = process.env.VALKEY_URL || process.env.REDIS_URL || "redis://127.0.0.1:6379";
   
   try {
      console.log(`Connecting to Valkey server at ${valkeyUrl}...`);
      const valkey = new ValkeyCache(valkeyUrl);
      await valkey.ping();
      console.log("🚀 Connected to Valkey server successfully!");
      cacheInstance = valkey;
      cacheType = "valkey";
   } catch (err: any) {
      console.warn("⚠️ Valkey server is not reachable. Falling back to in-memory cache. Error:", err.message);
      cacheInstance = new MemoryCache();
      cacheType = "memory";
   }

   return cacheInstance;
}

export function getCacheType(): "valkey" | "memory" {
   return cacheType;
}
