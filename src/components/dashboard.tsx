'use client';

import * as React from 'react';
import { useAuth } from '@/lib/firebase';
import {
  getPortfolio,
  addAsset,
  updateAsset,
  deleteAsset,
  Stock,
} from '@/lib/data';
import {
  getTickerDetails,
  getTickerPrice,
  getExchangeRate,
} from '@/lib/polygon';
import { PortfolioTable } from '@/components/portfolio-table';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PnlBarChart } from './pnl-bar-chart';
import { PortfolioAnalysisForm } from './portfolio-analysis-form';
import { runPortfolioAnalysis } from '@/app/actions';
import { AnalysisReport } from './analysis-report';
import { useToast } from '@/hooks/use-toast';
import { ExchangeRateChart } from './exchange-rate-chart';
import { StockHistoryChart } from './stock-history-chart';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = React.useState<Stock[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [analysisReport, setAnalysisReport] = React.useState<any | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      const unsubscribe = getPortfolio(user.uid, async (portfolio) => {
        setIsLoading(true);
        const portfolioWithDetails = await Promise.all(
          portfolio.map(async (asset) => {
            const details = await getTickerDetails(asset.ticker);
            const currentPrice = await getTickerPrice(asset.ticker);
            const logoUrl = details?.branding?.logo_url;
            return { ...asset, name: details?.name, currentPrice, logoUrl };
          })
        );
        setPortfolio(portfolioWithDetails);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddAsset = async (
    asset: Omit<Stock, 'id' | 'name' | 'exchange' | 'currentPrice' | 'logoUrl'>
  ) => {
    if (user) {
      await addAsset(user.uid, asset);
    }
  };

  const handleEditAsset = async (
    asset: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => {
    if (user) {
      await updateAsset(user.uid, asset.id, asset);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (user) {
      await deleteAsset(user.uid, assetId);
    }
  };

  const handleAnalysis = async (userInput: string) => {
    setIsAnalysisRunning(true);
    setAnalysisReport(null);
    try {
      const result = await runPortfolioAnalysis(portfolio, userInput);
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
    const pnlPercent = (pnl / purchaseValue) * 100;
    const portfolioShare = (currentValue / totalCurrentValue) * 100;

    return {
      ...asset,
      purchaseValue,
      currentValue,
      pnl,
      pnlPercent,
      portfolioShare,
    };
  });

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <PortfolioPieChart data={tableData} />
        <PnlBarChart data={tableData} />
        <ExchangeRateChart />
        <StockHistoryChart />
      </div>

      <PortfolioTable
        data={tableData}
        onAddAsset={handleAddAsset}
        onEditAsset={handleEditAsset}
        onDeleteAsset={handleDeleteAsset}
        isLoading={isLoading}
      />

      <PortfolioAnalysisForm
        onSubmit={handleAnalysis}
        isLoading={isAnalysisRunning}
      />
      {isAnalysisRunning && (
        <div className="flex justify-center items-center">
          <p>Analizando tu portafolio...</p>
        </div>
      )}
      {analysisReport && <AnalysisReport report={analysisReport} />}
    </div>
  );
}
