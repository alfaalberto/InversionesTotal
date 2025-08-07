
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

    let attempts = 0;
    const maxAttempts = 7;
    let currentDate = new Date();

    while (attempts < maxAttempts) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        try {
            const response = await fetch(
                `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/${formattedDate}/${formattedDate}`, {
                    headers: {
                        'Bmx-Token': BANXICO_API_TOKEN,
                    }
                }
            );

            if (response.ok) {
                const data: BanxicoResponse = await response.json();
                const rateData = data?.bmx?.series?.[0]?.datos?.[0];
                if (rateData && rateData.dato) {
                    return parseFloat(rateData.dato);
                }
            } else if (response.status !== 404) {
                // Log and stop if there's an actual API error (not just 'Not Found')
                console.error(`Banxico API error for date ${formattedDate}: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                console.error('Error body:', errorBody);
                return null; // Stop trying if there's a more serious error
            }
            // If response is 404 or data is empty, loop will continue to the previous day.

        } catch (error) {
            console.error(`Failed to fetch exchange rate for date ${formattedDate}:`, error);
            return null; // Stop on network or parsing error
        }

        // Go to the previous day
        currentDate.setDate(currentDate.getDate() - 1);
        attempts++;
    }
    
    console.warn(`Could not find exchange rate in the last ${maxAttempts} days.`);
    return null;
}
