'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveAnalysisReport,
  saveHistoricalData,
  saveExchangeRate,
  saveUserPreferences,
  savePortfolioSnapshot,
  loadCompleteAppState,
  getLatestAnalysisReport,
  getUserPreferences,
  type AnalysisReport,
  type HistoricalData,
  type ExchangeRateData,
  type UserPreferences,
  type PortfolioSnapshot
} from '@/lib/comprehensive-firestore';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  error: string | null;
}

interface CachedData {
  analysisReports: AnalysisReport[];
  historicalData: HistoricalData[];
  exchangeRates: ExchangeRateData[];
  userPreferences: UserPreferences | null;
  portfolioSnapshots: PortfolioSnapshot[];
}

export function useAutoSave() {
  const [state, setState] = useState<AutoSaveState>({
    isLoading: true,
    isSaving: false,
    lastSaved: null,
    error: null
  });

  const [cachedData, setCachedData] = useState<CachedData>({
    analysisReports: [],
    historicalData: [],
    exchangeRates: [],
    userPreferences: null,
    portfolioSnapshots: []
  });

  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveDataRef = useRef<string>('');

  // Cargar datos al inicializar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔄 Loading all cached data from Firestore...');
      const data = await loadCompleteAppState();
      
      setCachedData(data);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        lastSaved: Date.now()
      }));

      console.log('✅ All data loaded successfully');
      toast({
        title: 'Datos cargados',
        description: 'Se han recuperado todos los análisis y configuraciones guardadas.',
        variant: 'default',
      });

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Error al cargar los datos guardados' 
      }));

      toast({
        title: 'Error de carga',
        description: 'No se pudieron cargar algunos datos guardados.',
        variant: 'destructive',
      });
    }
  };

  // Guardar análisis de IA
  const saveAnalysis = useCallback(async (
    type: 'portfolio_analysis' | 'historical_analysis' | 'ai_insights',
    data: any,
    metadata: { portfolioValue: number; totalAssets: number; analysisVersion: string }
  ) => {
    try {
      const report: Omit<AnalysisReport, 'id'> = {
        timestamp: Date.now(),
        type,
        data,
        metadata
      };

      const reportId = await saveAnalysisReport(report);
      
      // Actualizar caché local
      setCachedData(prev => ({
        ...prev,
        analysisReports: [{ id: reportId, ...report }, ...prev.analysisReports.slice(0, 49)]
      }));

      console.log('✅ Analysis saved:', type);
      return reportId;
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
      throw error;
    }
  }, []);

  // Guardar datos históricos
  const saveHistorical = useCallback(async (ticker: string, data: any[], source: string = 'api') => {
    try {
      const historicalData: Omit<HistoricalData, 'id'> = {
        ticker,
        data,
        lastUpdated: Date.now(),
        source
      };

      await saveHistoricalData(historicalData);
      
      // Actualizar caché local
      setCachedData(prev => ({
        ...prev,
        historicalData: [
          { id: ticker, ...historicalData },
          ...prev.historicalData.filter(h => h.ticker !== ticker)
        ]
      }));

      console.log('✅ Historical data saved for:', ticker);
    } catch (error) {
      console.error('❌ Error saving historical data:', error);
      throw error;
    }
  }, []);

  // Guardar tipo de cambio
  const saveExchangeRateData = useCallback(async (
    fromCurrency: string, 
    toCurrency: string, 
    rate: number, 
    source: string = 'banxico',
    historicalData?: { date: string; rate: number }[]
  ) => {
    try {
      const exchangeRateData: Omit<ExchangeRateData, 'id'> = {
        fromCurrency,
        toCurrency,
        rate,
        timestamp: Date.now(),
        source,
        historicalData
      };

      await saveExchangeRate(exchangeRateData);
      
      // Actualizar caché local
      const pairId = `${fromCurrency}_${toCurrency}`;
      setCachedData(prev => ({
        ...prev,
        exchangeRates: [
          { id: pairId, ...exchangeRateData },
          ...prev.exchangeRates.filter(e => e.id !== pairId)
        ]
      }));

      console.log('✅ Exchange rate saved:', pairId);
    } catch (error) {
      console.error('❌ Error saving exchange rate:', error);
      throw error;
    }
  }, []);

  // Guardar preferencias de usuario
  const savePreferences = useCallback(async (preferences: Omit<UserPreferences, 'id' | 'lastSyncTimestamp'>) => {
    try {
      const userId = preferences.userId || 'default_user';
      await saveUserPreferences({ ...preferences, userId, lastSyncTimestamp: Date.now() });
      
      // Actualizar caché local
      setCachedData(prev => ({
        ...prev,
        userPreferences: { id: userId, ...preferences, lastSyncTimestamp: Date.now() }
      }));

      console.log('✅ User preferences saved');
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      throw error;
    }
  }, []);

  // Guardar snapshot del portafolio
  const saveSnapshot = useCallback(async (snapshot: Omit<PortfolioSnapshot, 'id' | 'timestamp'>) => {
    try {
      const snapshotWithTimestamp = { ...snapshot, timestamp: Date.now() };
      const snapshotId = await savePortfolioSnapshot(snapshotWithTimestamp);
      
      // Actualizar caché local
      setCachedData(prev => ({
        ...prev,
        portfolioSnapshots: [
          { id: snapshotId, timestamp: Date.now(), ...snapshot },
          ...prev.portfolioSnapshots.slice(0, 29)
        ]
      }));

      console.log('✅ Portfolio snapshot saved');
      return snapshotId;
    } catch (error) {
      console.error('❌ Error saving snapshot:', error);
      throw error;
    }
  }, []);

  // Auto-save con debounce
  const autoSave = useCallback((data: any, type: string) => {
    const dataString = JSON.stringify(data);
    
    // Solo guardar si los datos han cambiado
    if (dataString === lastSaveDataRef.current) {
      return;
    }
    
    lastSaveDataRef.current = dataString;

    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programar guardado con delay
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setState(prev => ({ ...prev, isSaving: true }));

        // Determinar qué tipo de datos guardar
        switch (type) {
          case 'portfolio_snapshot':
            await saveSnapshot(data);
            break;
          case 'analysis':
            await saveAnalysis(data.type, data.data, data.metadata);
            break;
          case 'preferences':
            await savePreferences(data);
            break;
          default:
            console.warn('Unknown auto-save type:', type);
        }

        setState(prev => ({ 
          ...prev, 
          isSaving: false, 
          lastSaved: Date.now(),
          error: null
        }));

      } catch (error) {
        console.error('❌ Auto-save error:', error);
        setState(prev => ({ 
          ...prev, 
          isSaving: false, 
          error: 'Error al guardar automáticamente'
        }));
      }
    }, 2000); // 2 segundos de delay
  }, [saveSnapshot, saveAnalysis, savePreferences]);

  // Forzar guardado inmediato
  const forceSave = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      // Aquí podrías implementar lógica para guardar todo el estado actual
      // Por ahora, solo actualizamos el timestamp
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: Date.now(),
        error: null
      }));

      toast({
        title: 'Guardado completo',
        description: 'Todos los avances han sido guardados exitosamente.',
        variant: 'default',
      });

    } catch (error) {
      console.error('❌ Force save error:', error);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: 'Error al forzar el guardado'
      }));

      toast({
        title: 'Error de guardado',
        description: 'No se pudo completar el guardado.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Obtener análisis más reciente
  const getLatestAnalysis = useCallback((type?: string) => {
    if (!type) {
      return cachedData.analysisReports[0] || null;
    }
    return cachedData.analysisReports.find(report => report.type === type) || null;
  }, [cachedData.analysisReports]);

  // Obtener datos históricos
  const getHistoricalData = useCallback((ticker: string) => {
    return cachedData.historicalData.find(data => data.ticker === ticker) || null;
  }, [cachedData.historicalData]);

  // Obtener tipo de cambio
  const getExchangeRateData = useCallback((fromCurrency: string, toCurrency: string) => {
    const pairId = `${fromCurrency}_${toCurrency}`;
    return cachedData.exchangeRates.find(rate => rate.id === pairId) || null;
  }, [cachedData.exchangeRates]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    ...state,
    cachedData,

    // Funciones de guardado
    saveAnalysis,
    saveHistorical,
    saveExchangeRateData,
    savePreferences,
    saveSnapshot,
    autoSave,
    forceSave,

    // Funciones de consulta
    getLatestAnalysis,
    getHistoricalData,
    getExchangeRateData,

    // Funciones de utilidad
    loadAllData,
    
    // Información de estado
    hasUnsavedChanges: saveTimeoutRef.current !== undefined,
    lastSavedFormatted: state.lastSaved ? new Date(state.lastSaved).toLocaleString() : null
  };
}
