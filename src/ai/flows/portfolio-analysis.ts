'use server';

/**
 * @fileOverview Portfolio analysis AI agent.
 *
 * - portfolioAnalysis - A function that handles the portfolio analysis process.
 * - PortfolioAnalysisInput - The input type for the portfolioAnalysis function.
 * - PortfolioAnalysisOutput - The return type for the portfolioAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PortfolioAnalysisInputSchema = z.object({
  portfolioImages: z
    .array(z.string())
    .describe(
      "Un arreglo de imágenes del portafolio de inversión, como URIs de datos que deben incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  portfolioData: z.string().describe('Los datos del portafolio de inversión.'),
});
export type PortfolioAnalysisInput = z.infer<typeof PortfolioAnalysisInputSchema>;

const PortfolioAnalysisOutputSchema = z.object({
  executiveSummary: z.string().describe('Un resumen ejecutivo del análisis del portafolio.'),
  quantitativeAnalysis: z
    .string()
    .describe('Un análisis cuantitativo del portafolio, incluyendo métricas clave.'),
  qualitativeAnalysis: z
    .string()
    .describe('Un análisis cualitativo del portafolio por emisor.'),
  suggestedVisualizations: z
    .string()
    .describe('Visualizaciones complementarias sugeridas para el análisis del portafolio.'),
  conclusionsAndRecommendations: z
    .string()
    .describe('Conclusiones y recomendaciones estratégicas para el portafolio.'),
});
export type PortfolioAnalysisOutput = z.infer<typeof PortfolioAnalysisOutputSchema>;

export async function portfolioAnalysis(input: PortfolioAnalysisInput): Promise<PortfolioAnalysisOutput> {
  return portfolioAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'portfolioAnalysisPrompt',
  input: {schema: PortfolioAnalysisInputSchema},
  output: {schema: PortfolioAnalysisOutputSchema},
  prompt: `Eres un analista financiero experto especializado en mercados de valores internacionales,
con un enfoque en estrategias de portafolio multi-activos con énfasis en acciones de EE. UU. y México,
análisis de rendimiento, riesgos y optimización.

Analizarás los datos y las imágenes del portafolio de inversión proporcionados para generar un informe completo.

Considera la siguiente información:

Datos del Portafolio: {{{portfolioData}}}

Imágenes del Portafolio:
{{#each portfolioImages}}
  {{media url=this}}
{{/each}}

Estructura el informe de la siguiente manera:

*   Resumen Ejecutivo
*   Análisis Cuantitativo del Portafolio
*   Análisis Cualitativo por Emisor
*   Visualizaciones complementarias sugeridas (p. ej., gráficos de dispersión de riesgo vs. retorno, mapa de calor sectorial, etc.)
*   Conclusiones y Recomendaciones Estratégicas


En tu análisis, por favor incluye:

1.  Evaluación del rendimiento general del portafolio tanto en USD como en MXN.
2.  Ranking de las acciones más y menos rentables, explicando brevemente las razones basadas en el comportamiento del mercado.
3.  Detección de posibles errores o ineficiencias, como sobre-concentración, baja diversificación o pérdidas acumuladas injustificadas.
4.  Recomendaciones para optimizar el portafolio, considerando:
    *   Rotación de activos no rentables
    *   Consolidación de posiciones ganadoras
    *   Diversificación por sector y región
    *   Gestión de riesgos por tipo de cambio
5.  Cálculo de métricas clave:
    *   Retorno total (%)
    *   Volatilidad (aproximada si no hay desviación estándar)
    *   Beta estimado del portafolio (asumiendo como benchmark QQQ o SPY)
    *   Alfa o retorno en exceso
6.  Evaluación del impacto del tipo de cambio USD/MXN en la rentabilidad de los activos mexicanos y estadounidenses.



Además, aclara si hay acciones con comportamiento anómalo (p. ej., caída abrupta injustificada, ganancia especulativa).
Si detectas activos duplicados o precios de entrada inconsistentes, indícalo.
Prioriza un enfoque profesional, con lenguaje técnico-financiero pero comprensible para inversores con conocimiento intermedio.
`,
});

const portfolioAnalysisFlow = ai.defineFlow(
  {
    name: 'portfolioAnalysisFlow',
    inputSchema: PortfolioAnalysisInputSchema,
    outputSchema: PortfolioAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
