// Unified price service client for frontend/server components
// Fetches from /api/price/unified with in-memory cache and batch helpers

export type PreferredSource = 'finnhub' | 'polygon';

interface GetPriceOptions {
  preferred?: PreferredSource;
  ttlMs?: number; // cache TTL on client side
  signal?: AbortSignal;
}

interface BatchOptions extends GetPriceOptions {
  concurrency?: number; // number of parallel requests
}

type PriceEntry = { price: number; source: string; fetchedAt: number; ttl: number };

const clientCache = new Map<string, PriceEntry>();
const DEFAULT_TTL = 60_000; // 60s

function normalizeTicker(t: string): string {
  return (t || '').trim().toUpperCase();
}

function now() {
  return Date.now();
}

function isValid(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function toCents(n: number): number {
  // avoid FP drift; keep two decimals consistently
  return Math.round(n * 100) / 100;
}

export async function getPrice(ticker: string, opts: GetPriceOptions = {}): Promise<{ price: number; source: string } | null> {
  const preferred = opts.preferred ?? 'finnhub';
  const ttl = opts.ttlMs ?? DEFAULT_TTL;
  const key = normalizeTicker(ticker);

  // cache hit
  const entry = clientCache.get(key);
  if (entry && entry.fetchedAt + entry.ttl > now()) {
    return { price: entry.price, source: entry.source };
  }

  const params = new URLSearchParams({ ticker: key, preferred, ttl: String(ttl) });
  const res = await fetch(`/api/price/unified?${params.toString()}`, { signal: opts.signal });
  if (!res.ok) return null;

  const data = await res.json();
  if (!isValid(data?.price)) return null;

  const price = toCents(Number(data.price));
  const source = String(data.source || preferred);

  clientCache.set(key, { price, source, fetchedAt: now(), ttl });
  return { price, source };
}

export async function getBatchPrices(tickers: string[], options: BatchOptions = {}) {
  const unique = Array.from(new Set(tickers.map(normalizeTicker))).filter(Boolean);
  const results = new Map<string, { price: number; source: string }>();

  if (unique.length === 0) return results;

  const concurrency = Math.max(1, Math.min(options.concurrency ?? 6, 12));
  const preferred = options.preferred ?? 'finnhub';
  const ttlMs = options.ttlMs ?? DEFAULT_TTL;

  let index = 0;
  async function worker() {
    while (index < unique.length) {
      const i = index++;
      const t = unique[i];
      try {
        const res = await getPrice(t, { preferred, ttlMs, signal: options.signal });
        if (res) results.set(t, res);
      } catch {
        // ignore per-ticker error
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}

export function clearPriceCache() {
  clientCache.clear();
}
