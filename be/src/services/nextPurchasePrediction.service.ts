import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { getCache, getCacheType, type CacheClient } from "../config/redis";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NextPurchasePredictionOptions {
  userId: string;
  limit?: number;
  model?: "auto" | "knn" | "svd" | "random_forest";
}

export interface NextPurchasePredictionResult {
  success: boolean;
  mode: string;
  metrics: {
    knn?: Record<string, unknown>;
    svd?: Record<string, unknown>;
    random_forest?: Record<string, unknown>;
    selected?: number;
  };
  data: {
    userId: string;
    recommendations: Array<{
      productId: string;
      score: number;
      modelScore: number;
      popularityScore: number;
      product: Record<string, unknown>;
    }>;
    historyCount: number;
    trainingRows: number;
    featureCount?: number;
    trainingUsers?: number;
    note?: string;
  };
  cache?: {
    hit: boolean;
    source: "redis" | "memory" | "python";
    ttlRemaining?: number;
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = Math.max(
  60,
  parseInt(process.env.RECOMMENDATION_CACHE_TTL_SECONDS || "1800", 10),
);

// Refresh in background when less than 25% TTL remains
const STALE_THRESHOLD = Math.floor(CACHE_TTL_SECONDS * 0.25);

function cacheKey(userId: string, limit: number): string {
  return `rec:next:${userId}:${limit}`;
}

// ---------------------------------------------------------------------------
// Python runner helpers
// ---------------------------------------------------------------------------

const candidatePythonCommands = (): Array<{
  command: string;
  args: string[];
}> => {
  if (process.env.PYTHON_BIN) {
    return [{ command: process.env.PYTHON_BIN, args: [] }];
  }

  if (process.platform === "win32") {
    return [
      { command: "py", args: ["-3"] },
      { command: "python", args: [] },
      { command: "python3", args: [] },
    ];
  }

  return [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
};

const resolveScriptPath = () => {
  const customPath = process.env.NEXT_PURCHASE_SCRIPT_PATH;
  if (customPath) return customPath;

  return path.resolve(process.cwd(), "ml", "next_purchase_recommender.py");
};

const runPythonScript = async (
  options: NextPurchasePredictionOptions,
  predictOnly = false,
): Promise<string> => {
  const scriptPath = resolveScriptPath();
  const args = [
    scriptPath,
    "--user-id",
    options.userId,
    "--limit",
    String(options.limit ?? 5),
    "--model",
    options.model ?? "auto",
  ];

  if (predictOnly) {
    args.push("--predict-only");
  }

  let lastError: unknown = null;

  for (const candidate of candidatePythonCommands()) {
    try {
      const { stdout } = await execFileAsync(
        candidate.command,
        [...candidate.args, ...args],
        {
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
        },
      );

      return stdout;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to execute Python recommender");
};

// ---------------------------------------------------------------------------
// Background refresh – fires and forgets
// ---------------------------------------------------------------------------

const refreshInProgress = new Set<string>();

function triggerBackgroundRefresh(
  options: NextPurchasePredictionOptions,
  cache: CacheClient,
  key: string,
): void {
  if (refreshInProgress.has(key)) return;
  refreshInProgress.add(key);

  runPythonScript(options, false)
    .then(async (stdout) => {
      const parsed = JSON.parse(stdout.trim()) as NextPurchasePredictionResult;
      if (parsed.success) {
        await cache.set(key, JSON.stringify(parsed), CACHE_TTL_SECONDS);
      }
    })
    .catch((err) => {
      console.warn("⚠️ Background recommendation refresh failed:", err.message);
    })
    .finally(() => {
      refreshInProgress.delete(key);
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getNextPurchasePredictions = async (
  options: NextPurchasePredictionOptions,
): Promise<NextPurchasePredictionResult> => {
  const limit = options.limit ?? 5;
  const key = cacheKey(options.userId, limit);
  const cache = await getCache();

  // 1. Try cache first
  const cached = await cache.get(key);

  if (cached) {
    const ttlRemaining = await cache.ttl(key);
    const parsed = JSON.parse(cached) as NextPurchasePredictionResult;

    // Stale-while-revalidate: refresh in background if close to expiry
    if (ttlRemaining >= 0 && ttlRemaining < STALE_THRESHOLD) {
      triggerBackgroundRefresh(options, cache, key);
    }

    parsed.cache = {
      hit: true,
      source: getCacheType(),
      ttlRemaining: ttlRemaining > 0 ? ttlRemaining : undefined,
    };
    return parsed;
  }

  // 2. Cache miss – try predict-only (fast, uses Python .joblib cache)
  try {
    const stdout = await runPythonScript(options, true);
    const parsed = JSON.parse(stdout.trim()) as NextPurchasePredictionResult;

    if (parsed.success) {
      await cache.set(key, JSON.stringify(parsed), CACHE_TTL_SECONDS);
      parsed.cache = { hit: false, source: "python" };
      return parsed;
    }
  } catch {
    // predict-only failed (no joblib cache) → fall through to full training
  }

  // 3. Full training run (slowest path, only on first-ever request)
  const stdout = await runPythonScript(options, false);
  const parsed = JSON.parse(stdout.trim()) as NextPurchasePredictionResult;

  if (!parsed.success) {
    throw new Error("Prediction pipeline returned an unsuccessful response");
  }

  await cache.set(key, JSON.stringify(parsed), CACHE_TTL_SECONDS);
  parsed.cache = { hit: false, source: "python" };
  return parsed;
};

// ---------------------------------------------------------------------------
// Cache invalidation – call after new invoice creation
// ---------------------------------------------------------------------------

export const invalidateRecommendationCache = async (
  userId: string,
): Promise<void> => {
  try {
    const cache = await getCache();
    const keys = await cache.keys(`rec:next:${userId}:*`);
    for (const key of keys) {
      await cache.del(key);
    }
  } catch (err: any) {
    console.warn("⚠️ Failed to invalidate recommendation cache:", err?.message);
  }
};
