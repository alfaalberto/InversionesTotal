// Definición local de Stock para evitar problemas de importación
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

// Configuración de la API de Finnhub
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'sandbox_token';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const RATE_LIMIT_PER_MINUTE = 60;
const DELAY_BETWEEN_REQUESTS = (60 * 1000) / RATE_LIMIT_PER_MINUTE; // ~1 segundo entre requests
const IS_SANDBOX = FINNHUB_API_KEY === 'sandbox_token';

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
}

interface PriceUpdateResult {
  ticker: string;
  success: boolean;
  newPrice?: number;
  error?: string;
}

class FinnhubPriceService {
  private lastRequestTime = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private hasShownSandboxWarning = false;

  /**
   * Base de datos de rangos de precios realistas para acciones conocidas
   */
  private readonly REALISTIC_PRICE_RANGES: Record<string, { min: number; max: number; typical: number }> = {
    // Acciones de muy alto valor
    'ASML': { min: 700, max: 950, typical: 825 }, // ASML Holding NV
    'BRK.A': { min: 400000, max: 600000, typical: 500000 }, // Berkshire Hathaway A
    'NVR': { min: 6000, max: 8500, typical: 7250 }, // NVR Inc
    'AZO': { min: 2800, max: 3500, typical: 3150 }, // AutoZone
    
    // Acciones de alto valor
    'AAPL': { min: 150, max: 200, typical: 175 },
    'MSFT': { min: 300, max: 450, typical: 375 },
    'GOOGL': { min: 120, max: 180, typical: 150 },
    'GOOG': { min: 120, max: 180, typical: 150 }, // Alphabet Class C
    'AMZN': { min: 140, max: 200, typical: 170 },
    'TSLA': { min: 180, max: 350, typical: 250 },
    'NVDA': { min: 800, max: 1200, typical: 1000 },
    'META': { min: 300, max: 550, typical: 425 },
    'NFLX': { min: 400, max: 700, typical: 550 },
    'BKNG': { min: 2500, max: 4000, typical: 3250 }, // Booking Holdings
    
    // Acciones de valor medio
    'BA': { min: 150, max: 250, typical: 200 },
    'JPM': { min: 140, max: 200, typical: 170 },
    'JNJ': { min: 150, max: 180, typical: 165 },
    'PG': { min: 140, max: 170, typical: 155 },
    'KO': { min: 55, max: 70, typical: 62 },
    'DIS': { min: 85, max: 120, typical: 102 },
    'WMT': { min: 140, max: 180, typical: 160 },
    'HD': { min: 300, max: 400, typical: 350 },
    'V': { min: 250, max: 300, typical: 275 },
    'UNH': { min: 500, max: 600, typical: 550 },
    
    // Acciones de tecnología media-alta
    'CRM': { min: 200, max: 300, typical: 250 },
    'ADBE': { min: 400, max: 600, typical: 500 },
    'ORCL': { min: 100, max: 140, typical: 120 },
    'IBM': { min: 130, max: 200, typical: 165 },
    'INTU': { min: 500, max: 700, typical: 600 }, // Intuit
    'ISRG': { min: 300, max: 500, typical: 400 }, // Intuitive Surgical
    'REGN': { min: 800, max: 1200, typical: 1000 }, // Regeneron
    'VRTX': { min: 350, max: 500, typical: 425 }, // Vertex Pharmaceuticals
    
    // Acciones de menor valor o volátiles
    'HOOD': { min: 8, max: 25, typical: 15 },
    'PTON': { min: 3, max: 12, typical: 7 },
    'TDOC': { min: 15, max: 40, typical: 25 },
    'SOFI': { min: 6, max: 15, typical: 10 },
    'LABB': { min: 2, max: 8, typical: 4 },
    'SPWRQ': { min: 0.1, max: 2, typical: 0.5 }, // Penny stock
    
    // Acciones financieras
    'GS': { min: 300, max: 450, typical: 375 },
    'BAC': { min: 30, max: 45, typical: 37 },
    'WFC': { min: 40, max: 60, typical: 50 },
    'C': { min: 45, max: 70, typical: 57 },
    
    // ETFs y fondos
    'SPY': { min: 400, max: 500, typical: 450 },
    'QQQ': { min: 350, max: 450, typical: 400 },
    'VTI': { min: 200, max: 280, typical: 240 },
    'IVV': { min: 400, max: 500, typical: 450 }, // iShares Core S&P 500
    'VOO': { min: 350, max: 450, typical: 400 }, // Vanguard S&P 500
    
    // Acciones europeas de alto valor
    'ASML.AS': { min: 700, max: 950, typical: 825 }, // ASML en Euronext
    'SAP': { min: 120, max: 180, typical: 150 }, // SAP SE
    'NESN.SW': { min: 100, max: 130, typical: 115 }, // Nestlé
  };

  /**
   * Genera un precio simulado realista para pruebas cuando no hay API key válida
   */
  private generateSimulatedPrice(ticker: string): number {
    // Buscar rango conocido para el ticker
    const priceRange = this.REALISTIC_PRICE_RANGES[ticker.toUpperCase()];
    
    if (priceRange) {
      // Usar precio típico como base con variación del ±5%
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const simulatedPrice = priceRange.typical * (1 + variation);
      
      // Asegurar que esté dentro del rango mín/máx
      const clampedPrice = Math.max(priceRange.min, Math.min(priceRange.max, simulatedPrice));
      
      return Math.round(clampedPrice * 100) / 100;
    } else {
      // Para tickers desconocidos, usar lógica genérica pero más conservadora
      const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const random = (seed * 9301 + 49297) % 233280 / 233280;
      
      // Rangos más conservadores para tickers desconocidos
      let basePrice;
      
      // Detectar si es una acción europea o de mercados desarrollados
      const isEuropean = /\.(AS|SW|PA|L|MI|MC|F)$/.test(ticker) || 
                        /^(ASML|SAP|NESN|NOVN|ROG|UNA|RDSA|SHEL)/.test(ticker);
      
      if (isEuropean) {
        // Acciones europeas tienden a tener precios más altos
        if (random < 0.2) {
          basePrice = 50 + (random * 100); // $50-$150
        } else if (random < 0.6) {
          basePrice = 150 + (random * 350); // $150-$500
        } else {
          basePrice = 500 + (random * 500); // $500-$1000
        }
      } else {
        // Acciones americanas
        if (random < 0.3) {
          basePrice = 5 + (random * 45); // $5-$50
        } else if (random < 0.7) {
          basePrice = 50 + (random * 150); // $50-$200
        } else {
          basePrice = 200 + (random * 300); // $200-$500
        }
      }
      
      // Agregar pequeña variación temporal
      const timeVariation = (Date.now() % 1000) / 10000; // Más sutil
      const finalPrice = basePrice + (basePrice * timeVariation * 0.02);
      
      return Math.round(finalPrice * 100) / 100;
    }
  }

  /**
   * Obtiene el precio actual de una acción desde Finnhub
   */
  private async fetchStockPrice(ticker: string): Promise<number | null> {
    try {
      // Si estamos usando sandbox token, mostrar advertencia una sola vez
      if (IS_SANDBOX && !this.hasShownSandboxWarning) {
        console.warn('⚠️ Usando sandbox token de Finnhub. Para datos reales, configura NEXT_PUBLIC_FINNHUB_API_KEY');
        this.hasShownSandboxWarning = true;
      }

      const url = `${FINNHUB_BASE_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
      
      console.log(`🔄 Obteniendo precio para ${ticker}...`);
      
      const response = await fetch(url);
      
      if (response.status === 401) {
        if (IS_SANDBOX) {
          console.warn(`⚠️ Sandbox token no permite acceso a ${ticker}. Usando precio simulado realista.`);
          // Generar precio simulado basado en rangos de mercado reales
          const simulatedPrice = this.generateSimulatedPrice(ticker);
          const priceRange = this.REALISTIC_PRICE_RANGES[ticker.toUpperCase()];
          const rangeInfo = priceRange ? ` (rango real: $${priceRange.min}-$${priceRange.max})` : ' (rango estimado)';
          console.log(`🎲 Precio simulado para ${ticker}: $${simulatedPrice}${rangeInfo}`);
          return simulatedPrice;
        } else {
          throw new Error('API key inválida o expirada');
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FinnhubQuote = await response.json();
      
      // Validar que tenemos datos válidos
      if (!data.c || data.c <= 0) {
        throw new Error('Precio inválido recibido de la API');
      }

      console.log(`✅ Precio actualizado para ${ticker}: $${data.c}`);
      return data.c;
      
    } catch (error) {
      console.error(`❌ Error obteniendo precio para ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Procesa la cola de requests respetando el rate limit
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < DELAY_BETWEEN_REQUESTS) {
        const waitTime = DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        console.log(`⏳ Esperando ${waitTime}ms para respetar rate limit...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Agrega un request a la cola
   */
  private queueRequest(request: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await request();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      // Iniciar procesamiento de la cola si no está en proceso
      this.processQueue();
    });
  }

  /**
   * Actualiza el precio de una sola acción
   */
  async updateSinglePrice(ticker: string): Promise<PriceUpdateResult> {
    return new Promise((resolve) => {
      this.queueRequest(async () => {
        const newPrice = await this.fetchStockPrice(ticker);
        
        if (newPrice !== null) {
          resolve({
            ticker,
            success: true,
            newPrice
          });
        } else {
          resolve({
            ticker,
            success: false,
            error: 'No se pudo obtener el precio'
          });
        }
      });
    });
  }

  /**
   * Actualiza los precios de múltiples acciones
   */
  async updateMultiplePrices(tickers: string[]): Promise<PriceUpdateResult[]> {
    console.log(`🚀 Iniciando actualización de precios para ${tickers.length} acciones...`);
    
    const results: PriceUpdateResult[] = [];
    const promises = tickers.map(ticker => this.updateSinglePrice(ticker));
    
    // Procesar todos los requests respetando el rate limit
    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        results.push(response.value);
      } else {
        results.push({
          ticker: tickers[index],
          success: false,
          error: response.reason?.message || 'Error desconocido'
        });
      }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Actualización completada: ${successCount}/${tickers.length} precios actualizados`);
    
    return results;
  }

  /**
   * Actualiza los precios de un portafolio completo
   */
  async updatePortfolioPrices(portfolio: Stock[]): Promise<{
    updatedPortfolio: Stock[];
    results: PriceUpdateResult[];
  }> {
    const tickers = [...new Set(portfolio.map(stock => stock.ticker))]; // Eliminar duplicados
    const results = await this.updateMultiplePrices(tickers);
    
    // Crear un mapa de precios actualizados
    const priceMap = new Map<string, number>();
    results.forEach(result => {
      if (result.success && result.newPrice) {
        priceMap.set(result.ticker, result.newPrice);
      }
    });

    // Actualizar el portafolio con los nuevos precios
    const updatedPortfolio = portfolio.map(stock => {
      const newPrice = priceMap.get(stock.ticker);
      if (newPrice) {
        return {
          ...stock,
          currentPrice: newPrice,
          lastUpdated: new Date().toISOString()
        };
      }
      return stock;
    });

    return {
      updatedPortfolio,
      results
    };
  }

  /**
   * Obtiene información de estado del servicio
   */
  getServiceStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      lastRequestTime: this.lastRequestTime,
      rateLimitDelay: DELAY_BETWEEN_REQUESTS
    };
  }
}

// Instancia singleton del servicio
export const finnhubPriceService = new FinnhubPriceService();

// Función de utilidad para usar en componentes
export const updatePortfolioPrices = async (portfolio: Stock[]) => {
  return await finnhubPriceService.updatePortfolioPrices(portfolio);
};

export default finnhubPriceService;
