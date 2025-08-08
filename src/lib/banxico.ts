
"use server";

import "server-only";

import fs from "fs";

const BANXICO_API_TOKEN = process.env.BANXICO_API_TOKEN || process.env.NEXT_PUBLIC_BANXICO_API_TOKEN;

// Cache para evitar llamadas repetidas a la API
let cachedRate: { rate: number; timestamp: number; date: string } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

if (!BANXICO_API_TOKEN) {
    console.warn("⚠️ Banxico API token not found. Exchange rates will use fallback value.");
    console.warn("Para obtener tipos de cambio reales, configura BANXICO_API_TOKEN en .env.local");
} else {
    console.log("✅ Banxico API token configurado correctamente");
}

interface BanxicoResponse {
    bmx: {
        series: {
            idSerie: string;
            titulo: string;
            datos: {
                fecha: string;
                dato: string;
            }[];
        }[];
    };
}

interface ExchangeRateInfo {
    rate: number | null;
    source: 'banxico' | 'cache' | 'fallback';
    date?: string;
    error?: string;
}


export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    // Solo soportamos MXN a USD por ahora
    if (from !== 'MXN' || to !== 'USD') {
        console.warn(`Conversión no soportada: ${from} a ${to}. Solo MXN a USD está disponible.`);
        return null;
    }
    
    // Verificar caché válido
    if (cachedRate && (Date.now() - cachedRate.timestamp) < CACHE_DURATION) {
        console.log(`💾 Usando tipo de cambio en caché: ${cachedRate.rate} (fecha: ${cachedRate.date})`);
        return cachedRate.rate;
    }
    
    if (!BANXICO_API_TOKEN) {
        console.warn('⚠️ Banxico API token no disponible. Usando tipo de cambio de respaldo.');
        const fallbackRate = 20.0; // Tipo de cambio de respaldo
        console.log(`🔄 Usando tipo de cambio de respaldo: ${fallbackRate}`);
        return fallbackRate;
    }

    console.log('💱 Obteniendo tipo de cambio USD/MXN desde Banxico...');
    
    let attempts = 0;
    const maxAttempts = 7;
    let currentDate = new Date();

    while (attempts < maxAttempts) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        try {
            console.log(`🔍 Consultando Banxico para fecha: ${formattedDate} (intento ${attempts + 1}/${maxAttempts})`);
            
            // Crear AbortController para timeout manual
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
            
            const response = await fetch(
                `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/${formattedDate}/${formattedDate}`, {
                    headers: {
                        'Bmx-Token': BANXICO_API_TOKEN,
                        'Accept': 'application/json',
                        'User-Agent': 'InversionesTotal-Dashboard/1.0'
                    },
                    signal: controller.signal
                }
            );
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data: BanxicoResponse = await response.json();
                const rateData = data?.bmx?.series?.[0]?.datos?.[0];
                
                if (rateData && rateData.dato && !isNaN(parseFloat(rateData.dato))) {
                    const rate = parseFloat(rateData.dato);
                    
                    // Guardar en caché
                    cachedRate = {
                        rate,
                        timestamp: Date.now(),
                        date: formattedDate
                    };
                    
                    console.log(`✅ Tipo de cambio obtenido: ${rate} MXN/USD (fecha: ${formattedDate})`);
                    return rate;
                } else {
                    console.warn(`⚠️ Datos inválidos para fecha ${formattedDate}:`, rateData);
                }
            } else if (response.status === 404) {
                console.log(`📅 No hay datos para ${formattedDate}, probando día anterior...`);
            } else {
                console.error(`❌ Error de API Banxico para ${formattedDate}: ${response.status} ${response.statusText}`);
                
                if (response.status === 401) {
                    console.error('❌ Token de Banxico inválido o expirado');
                    return null;
                }
                
                const errorBody = await response.text();
                console.error('Detalle del error:', errorBody);
                
                // Para errores serios, usar fallback
                if (response.status >= 500) {
                    console.warn('🔄 Error del servidor, usando tipo de cambio de respaldo');
                    return 20.0;
                }
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.error(`⏱️ Timeout consultando Banxico para ${formattedDate}`);
            } else {
                console.error(`❌ Error de red consultando Banxico para ${formattedDate}:`, error);
            }
            
            // En caso de error de red, usar fallback
            if (attempts === maxAttempts - 1) {
                console.warn('🔄 Error de conectividad, usando tipo de cambio de respaldo');
                return 20.0;
            }
        }

        // Ir al día anterior
        currentDate.setDate(currentDate.getDate() - 1);
        attempts++;
    }
    
    console.warn(`⚠️ No se pudo obtener tipo de cambio en los últimos ${maxAttempts} días.`);
    console.log('🔄 Usando tipo de cambio de respaldo: 20.0');
    return 20.0; // Fallback en lugar de null
}

/**
 * Obtiene el tipo de cambio con información adicional para debugging
 */
export async function getExchangeRateWithInfo(from: string, to: string): Promise<{
  rate: number | null;
  source: 'banxico' | 'cache' | 'fallback';
  date?: string;
  error?: string;
}> {
  try {
    const rate = await getExchangeRate(from, to);
    
    if (cachedRate && rate === cachedRate.rate) {
      return {
        rate,
        source: 'cache',
        date: cachedRate.date
      };
    }
    
    if (rate === 20.0 && !BANXICO_API_TOKEN) {
      return {
        rate,
        source: 'fallback',
        error: 'Token de Banxico no configurado'
      };
    }
    
    return {
      rate,
      source: rate ? 'banxico' : 'fallback',
      date: cachedRate?.date
    };
  } catch (error) {
    return {
      rate: 20.0,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Limpia el caché de tipos de cambio (para testing)
 * Debe ser async porque está en un archivo con "use server"
 */
export async function clearExchangeRateCache(): Promise<void> {
  cachedRate = null;
  console.log('🗑️ Caché de tipo de cambio limpiado');
}
