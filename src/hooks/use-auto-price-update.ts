import { useState, useEffect, useCallback } from 'react';
// Usando la definición de Stock del dashboard
interface Stock {
  id: string;
  ticker: string;
  exchange: 'NASDAQ' | 'NYSE' | 'BMV' | 'OTCM';
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  name?: string;
  logoUrl?: string;
  purchaseDate: string;
  originalCurrency?: 'USD' | 'MXN';
  originalPurchasePrice?: number;
  lastUpdated?: string;
}
import { updatePortfolioPrices } from '@/lib/finnhub-price-service';
import { useToast } from '@/hooks/use-toast';

interface AutoPriceUpdateState {
  isUpdating: boolean;
  lastUpdateTime: Date | null;
  updateProgress: {
    current: number;
    total: number;
  };
  errors: string[];
}

interface UseAutoPriceUpdateReturn {
  state: AutoPriceUpdateState;
  updatePrices: (portfolio: Stock[]) => Promise<Stock[]>;
  forceUpdate: (portfolio: Stock[]) => Promise<Stock[]>;
  canUpdate: boolean;
}

const MINIMUM_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos entre actualizaciones automáticas

export function useAutoPriceUpdate(): UseAutoPriceUpdateReturn {
  const { toast } = useToast();
  
  const [state, setState] = useState<AutoPriceUpdateState>({
    isUpdating: false,
    lastUpdateTime: null,
    updateProgress: { current: 0, total: 0 },
    errors: []
  });

  // Verificar si podemos hacer una actualización automática
  const canUpdate = useCallback(() => {
    if (state.isUpdating) return false;
    if (!state.lastUpdateTime) return true;
    
    const timeSinceLastUpdate = Date.now() - state.lastUpdateTime.getTime();
    return timeSinceLastUpdate >= MINIMUM_UPDATE_INTERVAL;
  }, [state.isUpdating, state.lastUpdateTime]);

  // Función principal para actualizar precios
  const updatePrices = useCallback(async (portfolio: Stock[]): Promise<Stock[]> => {
    if (!portfolio.length) return portfolio;
    
    setState(prev => ({
      ...prev,
      isUpdating: true,
      updateProgress: { current: 0, total: portfolio.length },
      errors: []
    }));

    try {
      console.log('🔄 Iniciando actualización automática de precios...');
      
      // Mostrar toast de inicio
      toast({
        title: 'Actualizando precios',
        description: `Obteniendo precios actuales para ${portfolio.length} activos...`,
        variant: 'default',
      });

      const { updatedPortfolio, results } = await updatePortfolioPrices(portfolio);
      
      // Contar éxitos y errores
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const errors = results
        .filter(r => !r.success)
        .map(r => `${r.ticker}: ${r.error || 'Error desconocido'}`);

      setState(prev => ({
        ...prev,
        isUpdating: false,
        lastUpdateTime: new Date(),
        updateProgress: { current: successCount, total: portfolio.length },
        errors
      }));

      // Mostrar resultado
      if (successCount > 0) {
        toast({
          title: 'Precios actualizados',
          description: `✅ ${successCount} precios actualizados correctamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
          variant: successCount === portfolio.length ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: 'Error de actualización',
          description: 'No se pudieron actualizar los precios. Verifica tu conexión a internet.',
          variant: 'destructive',
        });
      }

      console.log(`✅ Actualización completada: ${successCount}/${portfolio.length} precios actualizados`);
      
      return updatedPortfolio;
      
    } catch (error) {
      console.error('❌ Error en actualización de precios:', error);
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        errors: [`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      }));

      toast({
        title: 'Error de actualización',
        description: 'Ocurrió un error al actualizar los precios. Inténtalo de nuevo.',
        variant: 'destructive',
      });

      return portfolio;
    }
  }, [toast]);

  // Función para forzar actualización (ignora el intervalo mínimo)
  const forceUpdate = useCallback(async (portfolio: Stock[]): Promise<Stock[]> => {
    console.log('🚀 Forzando actualización de precios...');
    return await updatePrices(portfolio);
  }, [updatePrices]);

  // Función para actualización automática (respeta el intervalo mínimo)
  const autoUpdate = useCallback(async (portfolio: Stock[]): Promise<Stock[]> => {
    if (!canUpdate()) {
      console.log('⏳ Actualización automática omitida (muy pronto desde la última)');
      return portfolio;
    }
    
    console.log('🔄 Ejecutando actualización automática de precios...');
    return await updatePrices(portfolio);
  }, [canUpdate, updatePrices]);

  return {
    state,
    updatePrices: autoUpdate,
    forceUpdate,
    canUpdate: canUpdate()
  };
}

// Hook simplificado para usar en componentes que solo necesitan actualización automática
export function useAutoUpdateOnMount(portfolio: Stock[], onUpdate: (updatedPortfolio: Stock[]) => void) {
  const { updatePrices, state } = useAutoPriceUpdate();
  const [hasUpdated, setHasUpdated] = useState(false);

  useEffect(() => {
    // Solo actualizar una vez al montar el componente
    if (portfolio.length > 0 && !hasUpdated && !state.isUpdating) {
      setHasUpdated(true);
      
      updatePrices(portfolio).then(updatedPortfolio => {
        if (updatedPortfolio !== portfolio) {
          onUpdate(updatedPortfolio);
        }
      });
    }
  }, [portfolio, hasUpdated, state.isUpdating, updatePrices, onUpdate]);

  return {
    isUpdating: state.isUpdating,
    updateProgress: state.updateProgress,
    lastUpdateTime: state.lastUpdateTime
  };
}

export default useAutoPriceUpdate;
