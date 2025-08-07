
'use server';

import 'server-only';
import {
  getTickerDetails,
  getTickerPreviousClose,
  getExchangeRate,
} from '@/lib/polygon';
import { Stock } from '@/lib/data';
import {
  portfolioAnalysis,
  PortfolioAnalysisInput,
  PortfolioAnalysisOutput,
} from '@/ai/flows/portfolio-analysis';

export async function analyzePortfolioAction(
  input: PortfolioAnalysisInput
): Promise<{ success: true; data: PortfolioAnalysisOutput } | { success: false; error: string }> {
  try {
    const result = await portfolioAnalysis(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getEnhancedPortfolioData(
  stocks: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>[]
): Promise<Stock[]> {
  try {
    const exchangeRate = await getExchangeRate('MXN', 'USD', new Date().toISOString());

    const enrichedData: Stock[] = [];

    for (const [index, stock] of stocks.entries()) {
      // Fetches data sequentially to avoid API rate-limiting.
      const [details, price] = await Promise.all([
        getTickerDetails(stock.ticker),
        getTickerPreviousClose(stock.ticker),
      ]);
      
      const currentPrice = price ?? 0;

      let purchasePriceInUSD = stock.purchasePrice;
      let originalPurchasePrice = stock.purchasePrice;
      let originalCurrency = stock.currency;

      if (stock.currency === 'MXN' && exchangeRate) {
        purchasePriceInUSD = stock.purchasePrice / exchangeRate;
      } else if (stock.currency === 'MXN' && !exchangeRate) {
        console.warn(`Could not fetch exchange rate for MXN to USD. Asset ${stock.ticker} may have incorrect valuation.`);
      }
      
      enrichedData.push({
        ...stock,
        id: `${stock.ticker}-${index}`,
        name: details?.name || stock.ticker,
        currentPrice,
        purchasePrice: purchasePriceInUSD,
        originalPurchasePrice,
        originalCurrency,
      });

      // Add a delay to respect the API rate limit (e.g., 5 calls/min on free tier)
      // A 500ms delay between each stock should help spread out the requests.
      await delay(500);
    }

    return enrichedData;
  } catch (error) {
    console.error('Error enhancing portfolio data:', error);
    return stocks.map((stock, index) => ({
      ...stock,
      id: `${stock.ticker}-${index}`,
      name: stock.ticker,
      currentPrice: 0,
      logoUrl: undefined,
    }));
  }
}
