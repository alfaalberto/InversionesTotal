import { NextRequest, NextResponse } from 'next/server';

// Importes dinámicos para evitar cargar en edge erróneamente
async function getFinnhub(ticker: string): Promise<number | null> {
  const mod = await import('../../../../lib/finnhub');
  return mod.getFinnhubPrice(ticker);
}

async function getPolygon(ticker: string): Promise<number | null> {
  const mod = await import('../../../../lib/polygon');
  return mod.getTickerPrice(ticker);
}

// Caché simple en memoria por proceso (TTL en ms)
const cache = new Map<string, { price: number; expires: number; source: string }>();
const DEFAULT_TTL = 60_000; // 60s

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || '').trim().toUpperCase();
  const preferred = (searchParams.get('preferred') || 'finnhub').toLowerCase(); // finnhub|polygon
  const ttl = Number(searchParams.get('ttl') || DEFAULT_TTL);

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker requerido' }, { status: 400 });
  }

  const cacheKey = `${ticker}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    return NextResponse.json({ price: cached.price, source: cached.source, cached: true });
  }

  // Estrategia: preferido -> fallback
  const order = preferred === 'polygon' ? [getPolygon, getFinnhub] : [getFinnhub, getPolygon];
  let lastErr: unknown = null;
  for (const fn of order) {
    try {
      const price = await fn(ticker);
      if (typeof price === 'number' && !Number.isNaN(price) && price > 0) {
        const source = fn === getFinnhub ? 'finnhub' : 'polygon';
        cache.set(cacheKey, { price, expires: now + ttl, source });
        return NextResponse.json({ price, source, cached: false });
      }
    } catch (e) {
      lastErr = e;
      // continuar con fallback
    }
  }

  return NextResponse.json({ error: 'No se pudo obtener el precio', details: `${lastErr || ''}` }, { status: 502 });
}
