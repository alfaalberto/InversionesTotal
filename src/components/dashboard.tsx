
'use client';

import * as React from 'react';
import {
  getPortfolioFromFirestore,
  addAssetToFirestore,
  updateAssetInFirestore,
  deleteAssetFromFirestore,
  Stock,
} from '@/lib/firestore';
import {
  getTickerDetails,
  getTickerPrice,
  getExchangeRate,
} from '@/lib/polygon';
import { PortfolioTable } from '@/components/portfolio-table';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PnlBarChart } from './pnl-bar-chart';
import { AnalysisReport } from './analysis-report';
import { useToast } from '@/hooks/use-toast';
import { ExchangeRateChart } from './exchange-rate-chart';
import { StockHistoryChart } from './stock-history-chart';
import { portfolioAnalysis } from '@/ai/flows/portfolio-analysis';
import { PortfolioAnalysisForm } from './portfolio-analysis-form';

export default function Dashboard() {
  const [portfolio, setPortfolio] = React.useState<Stock[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [analysisReport, setAnalysisReport] = React.useState<any | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      const initialPortfolio = await getPortfolioFromFirestore();
      setPortfolio(initialPortfolio);
      setIsLoading(false);

      const portfolioWithDetails = await Promise.all(
        initialPortfolio.map(async (asset) => {
          try {
            const details = await getTickerDetails(asset.ticker);
            const currentPrice = await getTickerPrice(asset.ticker);
            const logoUrl = details?.branding?.icon_url;
            return {
              ...asset,
              name: details?.name || asset.name,
              currentPrice: currentPrice || asset.currentPrice,
              logoUrl,
            };
          } catch (error) {
            console.error(`Error fetching details for ${asset.ticker}`, error);
            return asset;
          }
        })
      );
      setPortfolio(portfolioWithDetails);
    };

    fetchPortfolio();
  }, []);

  const handleAddAsset = async (
    asset: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>
  ) => {
    try {
      const details = await getTickerDetails(asset.ticker);
      
      let purchasePriceInUSD = asset.purchasePrice;
      const originalPurchasePrice = asset.purchasePrice;
      const originalCurrency = asset.currency;

      if (asset.currency === 'MXN') {
        const rate = await getExchangeRate('MXN', 'USD', asset.purchaseDate);
        if (rate) {
          purchasePriceInUSD = asset.purchasePrice / rate;
        } else {
            toast({
                title: 'Error de Conversión',
                description: 'No se pudo obtener el tipo de cambio. El activo se guardará en USD con el precio original.',
                variant: 'destructive',
            });
        }
      }

      const newAsset: Omit<Stock, 'id'> = {
        ...asset,
        purchasePrice: purchasePriceInUSD,
        currency: 'USD',
        name: details?.name || asset.ticker,
        currentPrice: purchasePriceInUSD, // Assume current price is purchase price initially
        logoUrl: details?.branding?.icon_url || null,
        originalPurchasePrice,
        originalCurrency,
      };

      const newId = await addAssetToFirestore(newAsset);
      setPortfolio([...portfolio, { ...newAsset, id: newId }]);

    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el activo.',
        variant: 'destructive',
      });
    }
  };

  const handleEditAsset = async (
    asset: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => {
    await updateAssetInFirestore(asset.id, asset);
    setPortfolio(
      portfolio.map((p) => (p.id === asset.id ? { ...p, ...asset } : p))
    );
  };

  const handleDeleteAsset = async (assetId: string) => {
    await deleteAssetFromFirestore(assetId);
    setPortfolio(portfolio.filter((p) => p.id !== assetId));
  };

  const handleAnalysis = async (input: { portfolioData: string, portfolioImages: string[] }) => {
    setIsAnalysisRunning(true);
    setAnalysisReport(null);
    try {
      const result = await portfolioAnalysis(input);
      setAnalysisReport(result);
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: 'Error',
        description:
          'Ocurrió un error al ejecutar el análisis. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalysisRunning(false);
    }
  };

  const totalPurchaseValue = portfolio.reduce(
    (acc, asset) => acc + asset.purchasePrice * asset.quantity,
    0
  );
  const totalCurrentValue = portfolio.reduce(
    (acc, asset) =>
      acc + (asset.currentPrice ?? asset.purchasePrice) * asset.quantity,
    0
  );

  const tableData = portfolio.map((asset) => {
    const purchaseValue = asset.purchasePrice * asset.quantity;
    const currentValue =
      (asset.currentPrice ?? asset.purchasePrice) * asset.quantity;
    const pnl = currentValue - purchaseValue;
    const pnlPercent = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
    const portfolioShare =
      totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;
    
    const costBasis = (asset.originalPurchasePrice ?? asset.purchasePrice) * asset.quantity;

    return {
      ...asset,
      purchaseValue,
      currentValue,
      pnl,
      pnlPercent,
      portfolioShare,
      costBasis
    };
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <PortfolioPieChart data={tableData} />
        <PnlBarChart data={tableData} />
        <ExchangeRateChart />
        <StockHistoryChart tickers={[]} data={{}} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8">
        <PortfolioTable
          data={tableData}
          onAddAsset={handleAddAsset}
          onEditAsset={handleEditAsset}
          onDeleteAsset={handleDeleteAsset}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
        <PortfolioAnalysisForm onSubmit={handleAnalysis} isLoading={isAnalysisRunning} />
        <AnalysisReport result={analysisReport} isLoading={isAnalysisRunning} />
      </div>
    </main>
  );
}
