import axios from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

if (!FINNHUB_API_KEY) {
  throw new Error('FINNHUB_API_KEY is not set in environment variables');
}

export async function getFinnhubPrice(ticker: string): Promise<number | null> {
  try {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: ticker,
        token: FINNHUB_API_KEY,
      },
    });
    const price = response.data.c;
    if (typeof price === 'number' && !isNaN(price)) {
      return price;
    }
    return null;
  } catch (error) {
    return null;
  }
}
