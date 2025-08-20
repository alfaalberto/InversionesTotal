import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRateWithInfo } from '../../../lib/banxico';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') || 'USD';
  const to = req.nextUrl.searchParams.get('to') || 'MXN';

  try {
    const info = await getExchangeRateWithInfo(from, to);
    if (info.rate) {
      return NextResponse.json({ rate: info.rate, source: info.source, date: info.date });
    } else {
      return NextResponse.json({ error: info.error || 'No se pudo obtener el tipo de cambio.' }, { status: 502 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error interno.' }, { status: 500 });
  }
}
