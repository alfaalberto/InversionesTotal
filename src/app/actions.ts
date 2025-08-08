
'use server';

import 'server-only';
import {
  getTickerDetails,
  getTickerPrice,
} from '../lib/polygon';
import { getExchangeRate } from '../lib/banxico';
import { Stock } from '../lib/data';
import {
  portfolioAnalysis,
  PortfolioAnalysisInput,
  PortfolioAnalysisOutput,
} from '../ai/flows/portfolio-analysis';
import { getPortfolioFromFirestore } from '../lib/firestore';

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

export async function getEnhancedSingleStock(stock: Stock): Promise<Stock> {
  let exchangeRate = 1;
  try {
    if (stock.originalCurrency === 'MXN') {
      const rate = await getExchangeRate('MXN', 'USD');
      if (rate && !isNaN(rate)) exchangeRate = rate;
    }
  } catch (e) {
    // Si falla la API de Banxico, seguimos con exchangeRate=1
  }
  let details = null;
  let price = null;
  try {
    [details, price] = await Promise.all([
      getTickerDetails(stock.ticker),
      getTickerPrice(stock.ticker),
    ]);
  } catch (e) {
    // Si falla la API externa, seguimos usando los datos originales
  }
  const currentPrice = (price ?? stock.currentPrice ?? stock.purchasePrice ?? 0);
  let purchasePriceInUSD = stock.purchasePrice;
  // Solo convierte si la operación original fue en MXN y solo para este registro
  if (stock.originalCurrency === 'MXN' && stock.currency === 'MXN') {
    purchasePriceInUSD = stock.purchasePrice / exchangeRate;
  }
  // Si currency ya es USD, no se modifica purchasePrice

  return {
    ...stock,
    name: details?.name || stock.name || stock.ticker,
    currentPrice,
    purchasePrice: purchasePriceInUSD,
  };
}

export async function getEnhancedPortfolioData(
  stocks: Stock[]
): Promise<Stock[]> {
  const enrichedData: Stock[] = [];
  let exchangeRate = 1;
  try {
    const rate = await getExchangeRate('MXN', 'USD');
    if (rate && !isNaN(rate)) exchangeRate = rate;
  } catch (e) {
    // Si falla la API de Banxico, seguimos con exchangeRate=1
  }

  for (const stock of stocks) {
    let details = null;
    let price = null;
    try {
      [details, price] = await Promise.all([
        getTickerDetails(stock.ticker),
        getTickerPrice(stock.ticker),
      ]);
    } catch (e) {
      // Si falla la API externa, seguimos usando los datos originales
    }
    const currentPrice = (price ?? stock.currentPrice ?? stock.purchasePrice ?? 0);
    let purchasePriceInUSD = stock.purchasePrice;
    if (stock.originalCurrency === 'MXN') {
      purchasePriceInUSD = stock.purchasePrice * exchangeRate;
    }
    enrichedData.push({
      ...stock,
      name: details?.name || stock.name || stock.ticker,
      currentPrice,
      purchasePrice: purchasePriceInUSD,
    });
    // No hacer delay si la API falla, solo si el plan es free y hay éxito
    await delay(1500); // Reducido para mejor UX
  }
  return enrichedData;
}

export async function getInitialPortfolioData(): Promise<Stock[]> {
    return await getPortfolioFromFirestore();
}
