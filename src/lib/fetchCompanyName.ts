// Utilidad para obtener el nombre de empresa a partir de un ticker usando polygon.io o finnhub.io
// Requiere que configures tu API key en variables de entorno (o .env.local para Next.js)

export async function fetchCompanyName(ticker: string): Promise<string | null> {
  // Intenta polygon.io primero
  try {
    const polygonKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
    if (polygonKey) {
      const res = await fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${polygonKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.name) {
          return data.results.name;
        }
      }
    }
  } catch (e) { /* ignora y prueba finnhub */ }
  // Fallback a finnhub.io
  try {
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (finnhubKey) {
      const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.name) {
          return data.name;
        }
      }
    }
  } catch (e) { /* ignora */ }
  return null;
}
