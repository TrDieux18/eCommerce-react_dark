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
// Singleton
// ---------------------------------------------------------------------------
let cacheInstance: CacheClient | null = null;

export async function getCache(): Promise<CacheClient> {
   if (cacheInstance) return cacheInstance;

   console.log("using in-memory local cache");
   cacheInstance = new MemoryCache();
   return cacheInstance;
}

export function getCacheType(): "redis" | "memory" {
   return "memory";
}
