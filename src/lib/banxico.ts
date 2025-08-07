
"use server";

import "server-only";

const BANXICO_API_TOKEN = process.env.BANXICO_API_TOKEN;

if (!BANXICO_API_TOKEN) {
    console.warn("Banxico API token not found. Exchange rates will not be fetched.");
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
    
    // Try to get the rate for today.
    let rate = await fetchRateForDate(new Date());

    // If no rate for today (e.g., weekend/holiday), try up to 7 previous days.
    for (let i = 1; i <= 7 && !rate; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        rate = await fetchRateForDate(pastDate);
    }
    
    return rate;
}
