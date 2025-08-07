
"use server";

import "server-only";

const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
const BANXICO_API_TOKEN = process.env.BANXICO_API_TOKEN;


if (!POLYGON_API_KEY) {
    console.warn("Polygon API key not found. Company logos will not be fetched.");
}

if (!BANXICO_API_TOKEN) {
    console.warn("Banxico API token not found. Exchange rates will not be fetched.");
}

interface TickerDetails {
    ticker: string;
    name: string;
    branding?: {
        logo_url?: string;
        icon_url?: string;
    };
    results?: {
        ticker: string;
        name: string;
        branding?: {
            logo_url?: string;
            icon_url?: string;
        };
    }
}

interface PreviousClose {
    results?: {
        c: number; // Close price
    }[];
}

interface LastTrade {
    results?: {
        p: number; // Last trade price
    };
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


export async function getTickerDetails(ticker: string): Promise<TickerDetails['results'] | null> {
    if (!POLYGON_API_KEY) {
        return null;
    }

    // Clean up ticker symbol, especially for Mexican stocks
    const cleanedTicker = ticker.split(/[^A-Z0-9]/)[0];

    try {
        const response = await fetch(
            `https://api.polygon.io/v3/reference/tickers/${cleanedTicker}?apiKey=${POLYGON_API_KEY}`
        );

        if (!response.ok) {
            // Polygon might return 404 for tickers it doesn't recognize, which is fine.
            if (response.status !== 404) {
              console.error(`Error fetching ticker details for ${ticker}: ${response.statusText}`);
            }
            return null;
        }

        const data = await response.json();
        return data.results as TickerDetails['results'];
    } catch (error) {
        console.error(`Failed to fetch ticker details for ${ticker}:`, error);
        return null;
    }
}

export async function getTickerPreviousClose(ticker: string): Promise<number | null> {
    if (!POLYGON_API_KEY) {
        return null;
    }
    const cleanedTicker = ticker.split(/[^A-Z0-9]/)[0];

    try {
        const response = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${cleanedTicker}/prev?apiKey=${POLYGON_API_KEY}`
        );

        if (!response.ok) {
            if (response.status !== 404) {
                console.error(`Error fetching previous close for ${ticker}: ${response.statusText}`);
            }
            return null;
        }

        const data: PreviousClose = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].c;
        }

        return null;

    } catch (error) {
        console.error(`Failed to fetch previous close for ${ticker}:`, error);
        return null;
    }
}

export async function getTickerPrice(ticker: string): Promise<number | null> {
    if (!POLYGON_API_KEY) {
        return null;
    }
    const cleanedTicker = ticker.split(/[^A-Z0-9]/)[0];

    try {
        const response = await fetch(
            `https://api.polygon.io/v2/last/trade/${cleanedTicker}?apiKey=${POLYGON_API_KEY}`
        );

        if (!response.ok) {
            if (response.status !== 404) {
                console.error(`Error fetching real-time price for ${ticker}: ${response.statusText}`);
            }
            return null;
        }

        const data:LastTrade = await response.json();
        
        if (data.results) {
            return data.results.p;
        }

        return null;

    } catch (error) {
        console.error(`Failed to fetch real-time price for ${ticker}:`, error);
        return null;
    }
}

export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    if (from !== 'MXN' || to !== 'USD') {
        return null;
    }
    
    if (!BANXICO_API_TOKEN) {
        console.error('Banxico API token is required for MXN/USD exchange rate.');
        return null;
    }

    async function fetchRateForDate(date: Date): Promise<number | null> {
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const response = await fetch(
                `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/${formattedDate}/${formattedDate}`, {
                    headers: {
                        'Bmx-Token': BANXICO_API_TOKEN,
                    }
                }
            );

            if (!response.ok) {
                 // Don't log error for 404, as it's expected for non-business days
                if (response.status !== 404) {
                    console.error(`Banxico API error for date ${formattedDate}: ${response.status} ${response.statusText}`);
                }
                return null;
            }
            
            const data: BanxicoResponse = await response.json();
            const rateData = data?.bmx?.series?.[0]?.datos?.[0];
            
            if (rateData && rateData.dato) {
                return parseFloat(rateData.dato);
            }
            return null;

        } catch (error) {
            console.error(`Failed to fetch exchange rate for date ${date.toISOString().split('T')[0]}:`, error);
            return null;
        }
    }
    
    const today = new Date();
    let rate = await fetchRateForDate(today);

    if (rate) {
        return rate;
    }

    // If no rate for today (e.g., weekend/holiday), try yesterday
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    rate = await fetchRateForDate(yesterday);
    
    return rate;
}
