
'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DashboardHeader } from './dashboard-header';
import { PremiumTabs, PremiumTabContent } from './premium-tabs';
import {
  addAssetToFirestore,
  updateAssetInFirestore,
  deleteAssetFromFirestore,
} from '../lib/firestore';
import type { Stock } from '../lib/data';
import { getExchangeRate, getExchangeRateWithInfo, clearExchangeRateCache } from '../lib/banxico';
import { PortfolioTable } from './portfolio-table';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PnlBarChart } from './pnl-bar-chart';
import { SaveAllButton } from './SaveAllButton';
import { AnalysisReport } from './AnalysisReport';
import { useToast } from "../hooks/use-toast";
import { ExchangeRateChart } from './exchange-rate-chart';
import { StockHistoryChart } from './stock-history-chart';
import { PremiumHistoricalAnalysis } from './premium-historical-analysis';
import { portfolioAnalysis } from '../ai/flows/portfolio-analysis';
import { PremiumPortfolioAnalysis } from './premium-portfolio-analysis';
import { PremiumGraphicsDashboard } from './premium-graphics-dashboard';
import { useAutoSave } from '../hooks/use-auto-save';
import { useAutoPriceUpdate } from '../hooks/use-auto-price-update';
import { getEnhancedPortfolioData } from '../app/actions';

interface DashboardProps {
  initialData: Stock[];
}

import { convertUSDToMXN } from '../lib/currency';

export default function Dashboard({ initialData }: DashboardProps) {
  const [exchangeRate, setExchangeRate] = React.useState<number | null>(17.5);
  // Visualización del tipo de cambio Banxico
  // (esto irá en el render, justo antes del contenido principal)
  const exchangeRateBanner = (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4">
      <span className="font-bold text-blue-900 text-lg">Tipo de cambio USD/MXN (Banxico):</span>
      <span className="text-2xl font-mono text-blue-700">{exchangeRate ? `$${exchangeRate.toFixed(4)} MXN/USD` : 'Cargando...'}</span>
    </div>
  );
  console.log('🏦 Dashboard component rendered');
  const [portfolio, setPortfolio] = React.useState<Stock[]>(initialData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [analysisReport, setAnalysisReport] = React.useState<any | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = React.useState(false);
  const { toast } = useToast();

  // Estado para los totales correctos calculados por la tabla del portafolio
  const [portfolioTotals, setPortfolioTotals] = React.useState<{
    totalCostBasis: number;
    totalCurrentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
  } | null>(null);
  
  // Sistema de auto-guardado
  const { 
    isLoading: isSaving, 
    autoSave, 
    forceSave, 
    saveAnalysis, 
    saveSnapshot, 
    getLatestAnalysis,
    getHistoricalData,
    getExchangeRateData,
    cachedData
  } = useAutoSave();

  // Hook para actualización automática de precios
  const { 
    state: priceUpdateState, 
    updatePrices, 
    forceUpdate: forceUpdatePrices, 
    canUpdate: canUpdatePrices 
  } = useAutoPriceUpdate();

  // Estado para controlar la actualización automática
  const [hasAutoUpdated, setHasAutoUpdated] = React.useState(false);
  
  console.log('💱 Dashboard exchangeRate state:', exchangeRate);

  React.useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        console.log('💱 Iniciando obtención de tipo de cambio USD/MXN...');
        
        // Intentar obtener de caché primero
        const cachedRate = getExchangeRateData('USD', 'MXN');
        if (cachedRate && cachedRate.rate && (Date.now() - cachedRate.timestamp) < 3600000) { // 1 hora
          setExchangeRate(cachedRate.rate);
          console.log('💾 Tipo de cambio desde caché local:', cachedRate.rate);
          return;
        }

        // Obtener con información detallada desde Banxico
        const rateInfo = await getExchangeRateWithInfo('MXN', 'USD');
        
        if (rateInfo.rate) {
          setExchangeRate(rateInfo.rate);
          
          // Log detallado según la fuente
          switch (rateInfo.source) {
            case 'banxico':
              console.log(`✅ Tipo de cambio oficial desde Banxico: ${rateInfo.rate} (fecha: ${rateInfo.date})`);
              toast({
                title: "Tipo de cambio actualizado",
                description: `Obtenido desde Banco de México: $${rateInfo.rate} MXN/USD`,
              });
              break;
            case 'cache':
              console.log(`💾 Tipo de cambio desde caché Banxico: ${rateInfo.rate} (fecha: ${rateInfo.date})`);
              break;
            case 'fallback':
              console.warn(`⚠️ Usando tipo de cambio de respaldo: ${rateInfo.rate}`);
              if (rateInfo.error) {
                console.warn('Razón:', rateInfo.error);
              }
              toast({
                title: "Tipo de cambio de respaldo",
                description: `Usando valor estimado: $${rateInfo.rate} MXN/USD`,
                variant: "destructive"
              });
              break;
          }
          
          // Guardar en caché local
          autoSave({ 
            rate: rateInfo.rate, 
            timestamp: Date.now(),
            source: rateInfo.source,
            date: rateInfo.date
          }, 'exchange_rate_USD_MXN');
        } else {
          console.error('❌ No se pudo obtener ningún tipo de cambio');
          setExchangeRate(20); // Valor por defecto
          toast({
            title: "Error de tipo de cambio",
            description: "Usando valor por defecto: $20.00 MXN/USD",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Error crítico obteniendo tipo de cambio:', error);
        setExchangeRate(20); // Valor por defecto
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con Banco de México. Usando valor por defecto.",
          variant: "destructive"
        });
      }
    };
    fetchExchangeRate();
  }, [getExchangeRateData, autoSave, toast]);

  React.useEffect(() => {
    // Solo carga datos de Firestore, no enriquece con precios en tiempo real automáticamente
    setPortfolio(initialData);
    setIsLoading(false);
    
    // Cargar análisis previos si existen
    const latestAnalysis = getLatestAnalysis('portfolio_analysis');
    if (latestAnalysis) {
      console.log('📊 Loading cached analysis report');
      setAnalysisReport(latestAnalysis.data);
    }
  }, [initialData, getLatestAnalysis]);

  // Actualización automática de precios al cargar la aplicación
  React.useEffect(() => {
    if (portfolio.length > 0 && !hasAutoUpdated && !priceUpdateState.isUpdating && canUpdatePrices) {
      console.log('🚀 Iniciando actualización automática de precios al cargar...');
      setHasAutoUpdated(true);
      
      updatePrices(portfolio).then((updatedPortfolio: any) => {
        if (updatedPortfolio && updatedPortfolio !== portfolio) {
          console.log('✅ Precios actualizados, aplicando cambios...');
          setPortfolio(updatedPortfolio);
          
          // Auto-guardar el portafolio actualizado con validación
          updatedPortfolio.forEach(async (asset: any) => {
            if (!asset.id || asset.id.trim() === '') {
              console.warn(`Saltando actualización de ${asset.ticker}: ID inválido`);
              return;
            }
            
            try {
              await updateAssetInFirestore(asset.id, {
                currentPrice: asset.currentPrice
              });
              console.log(`✅ ${asset.ticker} precio actualizado`);
            } catch (error: any) {
              console.error(`❌ Error actualizando ${asset.ticker}:`, error);
              
              // Si el documento no existe, intentar recrearlo
              if (error.code === 'not-found') {
                console.log(`🔄 Recreando ${asset.ticker}...`);
                try {
                  await addAssetToFirestore({
                    ...asset,
                    id: undefined
                  } as any);
                  console.log(`✅ ${asset.ticker} recreado`);
                } catch (recreateError) {
                  console.error(`❌ Error recreando ${asset.ticker}:`, recreateError);
                }
              }
            }
          });
        }
      }).catch(error => {
        console.error('Error en actualización automática:', error);
        setHasAutoUpdated(false); // Permitir reintento
      });
    }
  }, [portfolio.length, hasAutoUpdated, priceUpdateState.isUpdating, canUpdatePrices, updatePrices]);

  // NUEVA LÓGICA: Identificar y corregir valores problemáticos automáticamente
  const totalCurrentValue = portfolio.reduce((acc, asset) => {
    let currentPriceUSD = asset.currentPrice ?? asset.purchasePrice;
    
    // DETECCIÓN INTELIGENTE: Si el precio es sospechosamente alto para una acción conocida
    const suspiciousThreshold = getSuspiciousThreshold(asset.ticker);
    if (currentPriceUSD > suspiciousThreshold && exchangeRate && exchangeRate > 1) {
      console.log(`🔄 AUTO-CONVERSIÓN ${asset.ticker}: ${currentPriceUSD} → ${(currentPriceUSD / exchangeRate).toFixed(2)} USD (umbral: ${suspiciousThreshold})`);
      currentPriceUSD = currentPriceUSD / exchangeRate;
    }
    
    return acc + currentPriceUSD * asset.quantity;
  }, 0);
  
  const totalCostBasis = portfolio.reduce((acc, asset) => {
    let purchasePriceUSD = asset.purchasePrice;
    
    // DETECCIÓN INTELIGENTE: Si el precio es sospechosamente alto para una acción conocida
    const suspiciousThreshold = getSuspiciousThreshold(asset.ticker);
    if (purchasePriceUSD > suspiciousThreshold && exchangeRate && exchangeRate > 1) {
      console.log(`🔄 AUTO-CONVERSIÓN COSTO ${asset.ticker}: ${purchasePriceUSD} → ${(purchasePriceUSD / exchangeRate).toFixed(2)} USD (umbral: ${suspiciousThreshold})`);
      purchasePriceUSD = purchasePriceUSD / exchangeRate;
    }
    
    return acc + purchasePriceUSD * asset.quantity;
  }, 0);
  
  // FUNCIÓN AUXILIAR: Determinar umbral sospechoso por ticker
  function getSuspiciousThreshold(ticker: string): number {
    const knownRanges: Record<string, number> = {
      // Acciones de muy alto valor
      'ASML': 1000, 'BRK.A': 600000, 'NVR': 8500, 'AZO': 3500, 'BKNG': 4000,
      
      // Acciones de alto valor
      'AAPL': 300, 'MSFT': 500, 'GOOGL': 200, 'GOOG': 200, 'AMZN': 250, 'TSLA': 400,
      'NVDA': 1500, 'META': 600, 'NFLX': 700, 'ADBE': 600, 'CRM': 300,
      'INTU': 700, 'ISRG': 500, 'REGN': 1200, 'VRTX': 500,
      
      // Acciones de valor medio
      'BA': 300, 'JPM': 250, 'JNJ': 200, 'AMD': 200, 'ORCL': 140, 'IBM': 200,
      'PG': 170, 'KO': 70, 'DIS': 120, 'WMT': 180, 'HD': 400, 'V': 300, 'UNH': 600,
      
      // Acciones volátiles/menor valor
      'HOOD': 50, 'SOFI': 30, 'PYPL': 100, 'TDOC': 50, 'ENPH': 100,
      'WBA': 50, 'SBUX': 150, 'NIO': 20, 'RIVN': 100, 'BOTZ': 50, 'INTC': 100, 'PFE': 100,
      'PTON': 12, 'LABB': 8, 'SPWRQ': 2,
      
      // Financieras
      'GS': 450, 'BAC': 45, 'WFC': 60, 'C': 70,
      
      // ETFs
      'SPY': 500, 'QQQ': 450, 'VTI': 280, 'IVV': 500, 'VOO': 450,
      
      // Acciones europeas
      'ASML.AS': 1000, 'SAP': 180, 'NESN.SW': 130
    };
    
    const upperTicker = ticker.toUpperCase();
    
    // Detectar acciones europeas por sufijo
    if (/\.(AS|SW|PA|L|MI|MC|F)$/.test(upperTicker)) {
      return knownRanges[upperTicker] || 500; // Umbral más alto para europeas
    }
    
    return knownRanges[upperTicker] || 200; // Default threshold
  }
  
  const totalPnL = totalCurrentValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  // DEBUGGING EXHAUSTIVO para identificar problemas de conversión
  React.useEffect(() => {
    console.log('\n=== DEBUGGING EXHAUSTIVO DE CONVERSIÓN ===');
    console.log('Portfolio length:', portfolio.length);
    console.log('Exchange Rate:', exchangeRate);
    console.log('Exchange Rate type:', typeof exchangeRate);
    console.log('Total Cost Basis calculado:', totalCostBasis);
    console.log('Total Current Value calculado:', totalCurrentValue);
    
    if (portfolio.length > 0) {
      console.log('\n--- ANÁLISIS POR ACTIVO ---');
      portfolio.forEach((asset, index) => {
        const costBasisCalculated = asset.purchasePrice * asset.quantity;
        const currentValueCalculated = (asset.currentPrice ?? asset.purchasePrice) * asset.quantity;
        
        console.log(`\n[${index + 1}] ${asset.ticker}:`);
        console.log('  - Currency:', asset.currency);
        console.log('  - Original Currency:', asset.originalCurrency);
        console.log('  - Purchase Price:', asset.purchasePrice);
        console.log('  - Original Purchase Price:', asset.originalPurchasePrice);
        console.log('  - Current Price:', asset.currentPrice);
        console.log('  - Quantity:', asset.quantity);
        console.log('  - Cost Basis (simple):', costBasisCalculated);
        console.log('  - Current Value (simple):', currentValueCalculated);
        
        // Detectar valores sospechosos usando umbrales dinámicos
        const threshold = getSuspiciousThreshold(asset.ticker);
        if (asset.purchasePrice > threshold) {
          console.warn(`  ⚠️ SOSPECHOSO: ${asset.ticker} purchasePrice $${asset.purchasePrice} > umbral $${threshold}`);
        }
        if (asset.currentPrice && asset.currentPrice > threshold) {
          console.warn(`  ⚠️ SOSPECHOSO: ${asset.ticker} currentPrice $${asset.currentPrice} > umbral $${threshold}`);
        }
        
        // Verificar si necesita conversión
        if (asset.originalCurrency === 'MXN') {
          console.log('  💱 ACTIVO MEXICANO - Requiere análisis de conversión');
          if (exchangeRate) {
            const convertedPurchase = asset.purchasePrice / exchangeRate;
            const convertedCurrent = (asset.currentPrice ?? asset.purchasePrice) / exchangeRate;
            console.log(`  🔄 Si se convirtiera: Purchase=${convertedPurchase.toFixed(2)}, Current=${convertedCurrent.toFixed(2)}`);
          } else {
            console.warn('  ⚠️ NO SE PUEDE CONVERTIR: exchangeRate es null');
          }
        }
      });
      
      console.log('\n--- RESUMEN DE TOTALES ---');
      const manualTotalCost = portfolio.reduce((acc, asset) => acc + (asset.purchasePrice * asset.quantity), 0);
      const manualTotalValue = portfolio.reduce((acc, asset) => acc + ((asset.currentPrice ?? asset.purchasePrice) * asset.quantity), 0);
      console.log('Total Cost (manual):', manualTotalCost);
      console.log('Total Value (manual):', manualTotalValue);
      console.log('Total Cost (calculated):', totalCostBasis);
      console.log('Total Value (calculated):', totalCurrentValue);
    }
    console.log('===============================================\n');
  }, [portfolio, exchangeRate, totalCostBasis, totalCurrentValue]);

  const tableData = React.useMemo(() => {
    const totalPortfolioValue = portfolio.reduce((acc, asset) => {
      const effectivePrice = asset.isFrozen && asset.frozenPrice 
        ? asset.frozenPrice 
        : (asset.currentPrice ?? asset.purchasePrice);
      return acc + (effectivePrice * asset.quantity);
    }, 0);

    return portfolio.map((asset) => {
      // Usar precio congelado si está disponible
      const effectiveCurrentPrice = asset.isFrozen && asset.frozenPrice 
        ? asset.frozenPrice 
        : (asset.currentPrice ?? asset.purchasePrice);
      
      const costBasisUSD = asset.purchasePrice * asset.quantity;
      const currentValueUSD = effectiveCurrentPrice * asset.quantity;
      const pnl = currentValueUSD - costBasisUSD;
      const pnlPercent = costBasisUSD > 0 ? (pnl / costBasisUSD) * 100 : 0;
      const portfolioShare = totalPortfolioValue > 0 ? (currentValueUSD / totalPortfolioValue) * 100 : 0;
      const purchaseValue = costBasisUSD; // purchaseValue es lo mismo que costBasis
      
      return {
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name || asset.ticker,
        quantity: asset.quantity,
        purchasePrice: asset.purchasePrice,
        currentPrice: effectiveCurrentPrice,
        costBasis: costBasisUSD,
        currentValue: currentValueUSD,
        pnl: pnl,
        pnlPercent: pnlPercent,
        portfolioShare: portfolioShare,
        purchaseValue: purchaseValue,
        exchange: asset.exchange,
        purchaseDate: asset.purchaseDate,
        currency: asset.currency,
        logoUrl: asset.logoUrl,
        isFrozen: asset.isFrozen,
        frozenPrice: asset.frozenPrice,
        frozenDate: asset.frozenDate,
        frozenSource: asset.frozenSource
      };
    });
  }, [portfolio]);

  // Auto-guardar snapshot del portafolio cuando cambien las métricas
  React.useEffect(() => {
    if (portfolio.length > 0 && !isLoading && exchangeRate && tableData.length > 0) {
      const topPerformer = tableData.reduce((max, asset) => 
        asset.pnlPercent > max.pnlPercent ? asset : max, 
        tableData[0]
      );
      const worstPerformer = tableData.reduce((min, asset) => 
        asset.pnlPercent < min.pnlPercent ? asset : min, 
        tableData[0]
      );
      
      const snapshot = {
        totalValue: totalCurrentValue,
        totalPnL: totalPnL,
        totalPnLPercent: totalPnLPercent,
        assetCount: portfolio.length,
        topPerformer: topPerformer?.name || topPerformer?.ticker || 'N/A',
        worstPerformer: worstPerformer?.name || worstPerformer?.ticker || 'N/A',
        exchangeRate: exchangeRate
      };
      
      // Auto-guardar con debounce
      autoSave(snapshot, 'portfolio_snapshot');
    }
  }, [portfolio, exchangeRate, totalCurrentValue, totalPnL, totalPnLPercent, tableData, isLoading, autoSave]);

  // FUNCIÓN DE EMERGENCIA: Corregir datos problemáticos en Firestore
  const fixProblematicData = React.useCallback(async () => {
    if (!exchangeRate || exchangeRate <= 1) {
      console.warn('⚠️ No se puede corregir: exchangeRate no válido:', exchangeRate);
      return;
    }
    
    console.log('🔧 INICIANDO CORRECCIÓN DE DATOS PROBLEMÁTICOS...');
    console.log('Portfolio actual:', portfolio.length, 'activos');
    
    let correctedCount = 0;
    let errorCount = 0;
    
    for (const asset of portfolio) {
      // Validar que el asset tenga ID válido
      if (!asset.id || asset.id.trim() === '') {
        console.warn(`⚠️ Saltando ${asset.ticker}: ID inválido o vacío`);
        continue;
      }
      
      const suspiciousThreshold = getSuspiciousThreshold(asset.ticker);
      let needsUpdate = false;
      const updates: any = {};
      
      // Verificar precio de compra
      if (asset.purchasePrice > suspiciousThreshold) {
        updates.purchasePrice = Number((asset.purchasePrice / exchangeRate).toFixed(2));
        updates.originalPurchasePrice = asset.purchasePrice;
        updates.originalCurrency = 'MXN';
        needsUpdate = true;
        console.log(`🔧 ${asset.ticker} (${asset.id}): purchasePrice ${asset.purchasePrice} → ${updates.purchasePrice} (umbral: ${suspiciousThreshold})`);
      }
      
      // Verificar precio actual
      if (asset.currentPrice && asset.currentPrice > suspiciousThreshold) {
        updates.currentPrice = Number((asset.currentPrice / exchangeRate).toFixed(2));
        needsUpdate = true;
        console.log(`🔧 ${asset.ticker} (${asset.id}): currentPrice ${asset.currentPrice} → ${updates.currentPrice} (umbral: ${suspiciousThreshold})`);
      }
      
      if (needsUpdate) {
        try {
          console.log(`🔄 Actualizando ${asset.ticker} con ID: ${asset.id}`);
          await updateAssetInFirestore(asset.id, updates);
          console.log(`✅ ${asset.ticker} corregido exitosamente`);
          correctedCount++;
        } catch (error: any) {
          console.error(`❌ Error corrigiendo ${asset.ticker} (${asset.id}):`, error);
          
          // Si es error de documento no encontrado, intentar recrear
          if (error.code === 'not-found' || error.message?.includes('No document to update')) {
            console.log(`🔄 Intentando recrear ${asset.ticker}...`);
            try {
              // Crear nuevo documento con los datos corregidos
              await addAssetToFirestore({
                ...asset,
                ...updates,
                id: undefined // Remover ID para crear nuevo
              } as any);
              console.log(`✅ ${asset.ticker} recreado exitosamente`);
              correctedCount++;
            } catch (recreateError) {
              console.error(`❌ Error recreando ${asset.ticker}:`, recreateError);
              errorCount++;
            }
          } else {
            errorCount++;
          }
        }
        
        // Pequeña pausa entre actualizaciones
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`🔧 CORRECCIÓN COMPLETADA:`);
    console.log(`✅ Activos corregidos: ${correctedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
    if (correctedCount > 0) {
      console.log('🔄 Recargando página para mostrar cambios...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('📊 No se encontraron datos para corregir');
    }
  }, [portfolio, exchangeRate]);
  
  // Exponer funciones globalmente para debugging
  React.useEffect(() => {
    (window as any).fixProblematicData = fixProblematicData;
    (window as any).clearExchangeRateCache = () => clearExchangeRateCache();
    (window as any).getExchangeRateInfo = () => getExchangeRateWithInfo('MXN', 'USD');
    console.log('🔧 Funciones de debugging disponibles:');
    console.log('  - window.fixProblematicData()');
    console.log('  - window.clearExchangeRateCache()');
    console.log('  - window.getExchangeRateInfo()');
  }, [fixProblematicData]);

  const handleAddAsset = async (
    asset: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>
  ) => {
    try {
      let purchasePriceInUSD = asset.purchasePrice;
      const originalPurchasePrice = asset.purchasePrice;
      const originalCurrency = asset.currency;

      if (asset.currency === 'MXN') {
        const rate = await getExchangeRate('MXN', 'USD');
        if (rate) {
          purchasePriceInUSD = asset.purchasePrice / rate;
        } else {
          toast({
            title: 'Error de Conversión',
            description:
              'No se pudo obtener el tipo de cambio. El activo se guardará en USD con el precio original.',
            variant: 'destructive',
          });
        }
      }

      const newAssetData: Omit<Stock, 'id'> & Partial<Pick<Stock, 'name'>> = {
        ...asset,
        purchasePrice: purchasePriceInUSD,
        currency: 'USD', // Standardize to USD for internal calculations
        name: (asset as any).name || asset.ticker, // Name will be fetched on the server
        currentPrice: purchasePriceInUSD, // Assume current price is purchase price initially
        originalPurchasePrice,
        originalCurrency,
      };

      const newId = await addAssetToFirestore(newAssetData);
      // Enriquecer solo el nuevo activo
      const { getEnhancedSingleStock } = await import('../app/actions');
      const enriched = await getEnhancedSingleStock({ ...newAssetData, id: newId });
      setPortfolio([...portfolio, enriched]);

    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el activo.',
        variant: 'destructive',
      });
    }
  };

  const [highlightedRow, setHighlightedRow] = React.useState<string | null>(null);

  const handleEditAsset = async (
    asset: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => {
    await updateAssetInFirestore(asset.id, {
      quantity: asset.quantity,
      purchasePrice: asset.purchasePrice,
      purchaseDate: asset.purchaseDate,
    });
    // Enriquecer solo el activo editado
    const { getEnhancedSingleStock } = await import('../app/actions');
    const enriched = await getEnhancedSingleStock({ ...portfolio.find(p => p.id === asset.id)!, ...asset });
    setPortfolio(
      portfolio.map((p) => (p.id === asset.id ? enriched : p))
    );
    setHighlightedRow(asset.id);
    setTimeout(() => setHighlightedRow(null), 2000);
    toast({
      title: 'Activo Actualizado',
      description: 'Los cambios en el activo se han guardado correctamente.',
    });
  };



  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetFromFirestore(assetId);
      setPortfolio(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        title: "Activo eliminado",
        description: "El activo ha sido eliminado del portafolio.",
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el activo.",
        variant: "destructive",
      });
    }
  };

  // Funciones para congelar/descongelar valores
  const handleFreezeAsset = async (assetId: string, frozenPrice: number, source: string) => {
    try {
      const updatedAsset = {
        isFrozen: true,
        frozenPrice: frozenPrice,
        frozenDate: new Date().toISOString(),
        frozenSource: source
      };
      
      await updateAssetInFirestore(assetId, updatedAsset);
      
      setPortfolio(prev => prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, ...updatedAsset }
          : asset
      ));
      
      console.log(`❄️ Precio congelado para ${assetId}: $${frozenPrice} (${source})`);
      toast({
        title: "Precio congelado",
        description: `Precio de $${frozenPrice.toFixed(2)} congelado desde ${source}`,
      });
    } catch (error: any) {
      console.error('Error freezing asset:', error);
      
      // Manejo específico para documento no encontrado
      if (error.code === 'not-found' || error.message?.includes('No document to update')) {
        console.log(`🔄 Documento ${assetId} no encontrado, intentando recrear...`);
        
        try {
          // Buscar el activo en el estado local
          const assetToRecreate = portfolio.find(asset => asset.id === assetId);
          if (assetToRecreate) {
            // Recrear el documento completo con los datos congelados
            const newAsset = {
              ...assetToRecreate,
              isFrozen: true,
              frozenPrice: frozenPrice,
              frozenDate: new Date().toISOString(),
              frozenSource: source
            };
            
            // Eliminar el ID para crear un nuevo documento
            const { id, ...assetWithoutId } = newAsset;
            await addAssetToFirestore(assetWithoutId as any);
            
            // Actualizar el estado local
            setPortfolio(prev => prev.map(asset => 
              asset.id === assetId 
                ? newAsset
                : asset
            ));
            
            console.log(`✅ Documento recreado y precio congelado para ${assetId}`);
            toast({
              title: "Precio congelado",
              description: `Documento recreado y precio de $${frozenPrice.toFixed(2)} congelado desde ${source}`,
            });
          } else {
            throw new Error('Activo no encontrado en el estado local');
          }
        } catch (recreateError) {
          console.error('Error recreando documento:', recreateError);
          toast({
            title: "Error crítico",
            description: "No se pudo recrear el documento del activo. Considera eliminar y volver a agregar este activo.",
            variant: "destructive",
          });
        }
      } else {
        // Error genérico
        toast({
          title: "Error",
          description: "No se pudo congelar el precio del activo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUnfreezeAsset = async (assetId: string) => {
    try {
      const updatedAsset = {
        isFrozen: false,
        frozenPrice: undefined,
        frozenDate: undefined,
        frozenSource: undefined
      };
      
      await updateAssetInFirestore(assetId, updatedAsset);
      
      setPortfolio(prev => prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, ...updatedAsset }
          : asset
      ));
      
      console.log(`🔄 Precio descongelado para ${assetId}`);
      toast({
        title: "Precio descongelado",
        description: "El precio ahora se actualizará automáticamente",
      });
    } catch (error: any) {
      console.error('Error unfreezing asset:', error);
      
      // Manejo específico para documento no encontrado
      if (error.code === 'not-found' || error.message?.includes('No document to update')) {
        console.log(`🔄 Documento ${assetId} no encontrado, intentando recrear...`);
        
        try {
          // Buscar el activo en el estado local
          const assetToRecreate = portfolio.find(asset => asset.id === assetId);
          if (assetToRecreate) {
            // Recrear el documento completo sin congelación
            const newAsset = {
              ...assetToRecreate,
              isFrozen: false,
              frozenPrice: undefined,
              frozenDate: undefined,
              frozenSource: undefined
            };
            
            // Eliminar el ID para crear un nuevo documento
            const { id, ...assetWithoutId } = newAsset;
            await addAssetToFirestore(assetWithoutId as any);
            
            // Actualizar el estado local
            setPortfolio(prev => prev.map(asset => 
              asset.id === assetId 
                ? newAsset
                : asset
            ));
            
            console.log(`✅ Documento recreado y precio descongelado para ${assetId}`);
            toast({
              title: "Precio descongelado",
              description: "Documento recreado y precio ahora se actualizará automáticamente",
            });
          } else {
            throw new Error('Activo no encontrado en el estado local');
          }
        } catch (recreateError) {
          console.error('Error recreando documento:', recreateError);
          toast({
            title: "Error crítico",
            description: "No se pudo recrear el documento del activo. Considera eliminar y volver a agregar este activo.",
            variant: "destructive",
          });
        }
      } else {
        // Error genérico
        toast({
          title: "Error",
          description: "No se pudo descongelar el precio del activo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalysis = async (input: {
    portfolioData: string;
    portfolioImages: string[];
  }) => {
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

  // Las variables duplicadas se eliminan - se usan las declaradas arriba

  // Permite actualización individual de precio desde PortfolioTable
  React.useEffect(() => {
    (window as any).__updatePriceRow = (id: string, newPrice: number) => {
      setPortfolio(prev => prev.map(a => a.id === id ? { ...a, currentPrice: newPrice } : a));
    };
    return () => {
      delete (window as any).__updatePriceRow;
    };
  }, []);

  // Estado para el guardado global
  const [isSavingAll, setIsSavingAll] = React.useState(false);

  // Función para actualizar precios manualmente
  const handleUpdatePrices = async () => {
    if (portfolio.length === 0) {
      toast({
        title: 'Sin activos',
        description: 'No hay activos en el portafolio para actualizar.',
        variant: 'default',
      });
      return;
    }

    try {
      const updatedPortfolio = await forceUpdatePrices(portfolio);
      
      if (updatedPortfolio && updatedPortfolio !== portfolio) {
        // Asegurar compatibilidad de tipos agregando currency si falta
        const compatiblePortfolio = updatedPortfolio.map((asset: any) => ({
          ...asset,
          currency: asset.currency || asset.originalCurrency || 'USD'
        }));
        setPortfolio(compatiblePortfolio);
        
        // Guardar los precios actualizados en Firestore
        const updatePromises = compatiblePortfolio.map(async (asset: any) => {
          try {
            await updateAssetInFirestore(asset.id, {
              currentPrice: asset.currentPrice
            });
          } catch (error) {
            console.error(`Error guardando precio actualizado para ${asset.ticker}:`, error);
          }
        });
        
        await Promise.allSettled(updatePromises);
      }
    } catch (error) {
      console.error('Error en actualización manual de precios:', error);
    }
  };

  // Función de guardado completo
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      // Forzar guardado completo
      await forceSave();
      
      // Guardar snapshot actual del portafolio
      if (portfolio.length > 0 && exchangeRate) {
        await saveSnapshot({
          totalValue: totalCurrentValue,
          totalPnL: totalPnL,
          totalPnLPercent: totalPnLPercent,
          assetCount: portfolio.length,
          topPerformer: tableData.length > 0 ? (() => {
            const topPerformer = tableData.reduce((max, asset) => 
              asset.pnlPercent > max.pnlPercent ? asset : max, 
              tableData[0]
            );
            return topPerformer?.name || topPerformer?.ticker || 'N/A';
          })() : 'N/A',
          worstPerformer: tableData.length > 0 ? (() => {
            const worstPerformer = tableData.reduce((min, asset) => 
              asset.pnlPercent < min.pnlPercent ? asset : min, 
              tableData[0]
            );
            return worstPerformer?.name || worstPerformer?.ticker || 'N/A';
          })() : 'N/A',
          exchangeRate: exchangeRate
        });
      }
      
      // Guardar análisis actual si existe
      if (analysisReport) {
        await saveAnalysis('portfolio_analysis', analysisReport, {
          portfolioValue: totalCurrentValue,
          totalAssets: portfolio.length,
          analysisVersion: '1.0'
        });
      }
      
      setIsSavingAll(false);
      toast({
        title: 'Avances guardados',
        description: 'Todos los cambios y avances han sido guardados exitosamente en Firebase.',
        variant: 'default',
      });
    } catch (error) {
      console.error('❌ Error saving all data:', error);
      setIsSavingAll(false);
      toast({
        title: 'Error de guardado',
        description: 'Hubo un problema al guardar algunos datos. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  // Botón de emergencia para corregir datos
  const EmergencyFixButton = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={fixProblematicData}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="Corregir datos problemáticos en Firestore"
      >
        🔧 Corregir Datos
      </button>
      <button
        onClick={async () => {
          console.log('🔄 Refrescando tipo de cambio...');
          await clearExchangeRateCache();
          try {
            const rateInfo = await getExchangeRateWithInfo('MXN', 'USD');
            if (rateInfo.rate) {
              setExchangeRate(rateInfo.rate);
              autoSave({ 
                rate: rateInfo.rate, 
                timestamp: Date.now(),
                source: rateInfo.source,
                date: rateInfo.date
              }, 'exchange_rate_USD_MXN');
              console.log(`✅ Tipo de cambio actualizado: ${rateInfo.rate} (${rateInfo.source})`);
              toast({
                title: "Tipo de cambio actualizado",
                description: `Nuevo valor: $${rateInfo.rate} MXN/USD (${rateInfo.source})`,
              });
            }
          } catch (error) {
            console.error('❌ Error refrescando tipo de cambio:', error);
            toast({
              title: "Error",
              description: "No se pudo actualizar el tipo de cambio",
              variant: "destructive"
            });
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="Refrescar tipo de cambio desde Banxico"
      >
        💱 Refrescar TC
      </button>
      <button
        onClick={async () => {
          console.log('=== DIAGNÓSTICO COMPLETO ===');
          console.log('Portfolio:', portfolio);
          console.log('Exchange Rate:', exchangeRate);
          
          // Diagnóstico del tipo de cambio
          console.log('\n--- DIAGNÓSTICO TIPO DE CAMBIO ---');
          try {
            const rateInfo = await getExchangeRateWithInfo('MXN', 'USD');
            console.log('Información del tipo de cambio:', rateInfo);
            
            const cachedRate = getExchangeRateData('USD', 'MXN');
            console.log('Caché local:', cachedRate);
          } catch (error) {
            console.error('Error obteniendo info del tipo de cambio:', error);
          }
          
          console.log('\n--- ANÁLISIS POR ACTIVO ---');
          portfolio.forEach(asset => {
            const threshold = getSuspiciousThreshold(asset.ticker);
            const needsPurchaseConversion = asset.purchasePrice > threshold;
            const needsCurrentConversion = (asset.currentPrice || 0) > threshold;
            
            console.log(`\n${asset.ticker}:`, {
              id: asset.id,
              purchasePrice: asset.purchasePrice,
              currentPrice: asset.currentPrice,
              threshold: threshold,
              needsPurchaseConversion,
              needsCurrentConversion,
              wouldConvertTo: {
                purchase: needsPurchaseConversion && exchangeRate ? (asset.purchasePrice / exchangeRate).toFixed(2) : 'N/A',
                current: needsCurrentConversion && exchangeRate ? ((asset.currentPrice || 0) / exchangeRate).toFixed(2) : 'N/A'
              }
            });
          });
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="Mostrar diagnóstico completo en consola"
      >
        🔍 Diagnosticar
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto p-6 space-y-8">
        <DashboardHeader
        totalValue={portfolioTotals?.totalCurrentValue || 0}
        totalPnL={portfolioTotals?.totalPnL || 0}
        totalPnLPercent={portfolioTotals?.totalPnLPercent || 0}
        exchangeRate={exchangeRate}
        onSaveAll={handleSaveAll}
        isSaving={isSavingAll || isSaving}
      />
    
    <PremiumTabs defaultValue="resumen" className="">
      <PremiumTabContent 
        value="resumen" 
        title="Resumen del Portafolio"
        description="Vista general de todos tus activos e inversiones con conversión automática de moneda."
      >
        <PortfolioTable
          data={tableData}
          onAddAsset={handleAddAsset}
          onEditAsset={handleEditAsset}
          onDeleteAsset={handleDeleteAsset}
          onFreezeAsset={handleFreezeAsset}
          onUnfreezeAsset={handleUnfreezeAsset}
          isLoading={isLoading}
          highlightedRowId={highlightedRow}
          exchangeRate={exchangeRate}
          onTotalsCalculated={setPortfolioTotals}
        />
      </PremiumTabContent>
      <PremiumTabContent 
        value="graficos" 
        title="Visualizaciones y Gráficos"
        description="Análisis visual interactivo de la distribución, rendimiento y tendencias de tu portafolio."
      >
        <PremiumGraphicsDashboard
          data={tableData}
          totalValue={portfolioTotals?.totalCurrentValue || 0}
          totalPnL={portfolioTotals?.totalPnL || 0}
          totalPnLPercent={portfolioTotals?.totalPnLPercent || 0}
          exchangeRate={exchangeRate}
        />
      </PremiumTabContent>
      <PremiumTabContent 
        value="historico" 
        title="Análisis Histórico"
        description="Evolución temporal de tus inversiones y análisis de tendencias históricas del mercado."
      >
        <PremiumHistoricalAnalysis 
          tickers={portfolio.map(asset => asset.ticker)}
          data={{}}
        />
      </PremiumTabContent>
      <PremiumTabContent 
        value="analisis" 
        title="Análisis con Inteligencia Artificial"
        description="Obtén insights avanzados y recomendaciones personalizadas para optimizar tu portafolio de inversiones."
      >
        <PremiumPortfolioAnalysis
          onAnalysisComplete={(report) => setAnalysisReport(report)}
        />
      </PremiumTabContent>
        </PremiumTabs>
      </div>
      <EmergencyFixButton />
    </div>
  );
}
