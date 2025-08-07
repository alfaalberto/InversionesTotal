
"use server";

import "server-only";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
    console.warn("Polygon API key not found. Company logos will not be fetched.");
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
