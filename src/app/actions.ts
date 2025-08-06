'use server';

import { portfolioAnalysis, type PortfolioAnalysisInput, type PortfolioAnalysisOutput } from '@/ai/flows/portfolio-analysis';

export async function analyzePortfolioAction(
  input: PortfolioAnalysisInput
): Promise<{ success: true; data: PortfolioAnalysisOutput } | { success: false; error: string }> {
  try {
    const result = await portfolioAnalysis(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error en la acción de analizar portafolio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al analizar el portafolio.';
    return { success: false, error: errorMessage };
  }
}
