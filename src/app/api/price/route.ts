import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  const source = searchParams.get('source');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker requerido' }, { status: 400 });
  }
  if (!source || (source !== 'polygon' && source !== 'finnhub')) {
    return NextResponse.json({ error: 'Fuente inválida' }, { status: 400 });
  }
  try {
    let price: number | null = null;
    if (source === 'polygon') {
      const { getTickerPrice } = await import('../../../lib/polygon');
      price = await getTickerPrice(ticker);
    } else if (source === 'finnhub') {
      const { getFinnhubPrice } = await import('../../../lib/finnhub');
      price = await getFinnhubPrice(ticker);
    }
    if (price && !isNaN(price)) {
      return NextResponse.json({ price });
    } else {
      return NextResponse.json({ error: 'No se pudo obtener el precio.' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno al obtener precio.' }, { status: 500 });
  }
}
