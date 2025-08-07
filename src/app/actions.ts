
'use server';

import 'server-only';
import {
  getTickerDetails,
  getTickerPrice,
} from '@/lib/polygon';
import { getExchangeRate } from '@/lib/banxico';
import { Stock } from '@/lib/data';
import {
  portfolioAnalysis,
  PortfolioAnalysisInput,
  PortfolioAnalysisOutput,
} from '@/ai/flows/portfolio-analysis';
import { getPortfolioFromFirestore } from '@/lib/firestore';

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
  stocks: Stock[]
): Promise<Stock[]> {
  try {
    const enrichedData: Stock[] = [];
    const exchangeRate = await getExchangeRate('MXN', 'USD');

    for (const stock of stocks) {
      // Fetches data sequentially to avoid API rate-limiting.
      const [details, price] = await Promise.all([
        getTickerDetails(stock.ticker),
        getTickerPrice(stock.ticker),
      ]);
      
      const currentPrice = price ?? stock.currentPrice ?? 0;

      let purchasePriceInUSD = stock.purchasePrice;
      
      // If original currency is MXN, we need to convert purchase price for calculations
      if (stock.originalCurrency === 'MXN' && stock.originalPurchasePrice && exchangeRate) {
        purchasePriceInUSD = stock.originalPurchasePrice / exchangeRate;
      }

      enrichedData.push({
        ...stock,
        name: details?.name || stock.name || stock.ticker,
        currentPrice,
        purchasePrice: purchasePriceInUSD, // This is now consistently in USD for calculations
      });

      // Increase delay to be safer with the API rate limit (5 calls/min on free tier)
      await delay(15000); 
    }

    return enrichedData;
  } catch (error) {
    console.error('Error enhancing portfolio data:', error);
    // Return original stocks if enhancement fails
    return stocks.map(stock => ({
      ...stock,
      name: stock.name || stock.ticker,
      currentPrice: stock.currentPrice || stock.purchasePrice,
    }));
  }
}

export async function getInitialPortfolioData(): Promise<Stock[]> {
    return await getPortfolioFromFirestore();
}
