'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Sparkles, 
  Loader2, 
  Send,
  Lightbulb,
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';
import { AnalysisReport, AnalysisReportProps } from './AnalysisReport';

interface PremiumPortfolioAnalysisProps {
  onAnalysisComplete?: (report: AnalysisReportProps['report']) => void;
}

export function PremiumPortfolioAnalysis({ onAnalysisComplete }: PremiumPortfolioAnalysisProps) {
  const [query, setQuery] = React.useState('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisReport, setAnalysisReport] = React.useState<AnalysisReportProps['report'] | null>(null);
  const [progress, setProgress] = React.useState(0);

  const handleAnalysis = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    
    // Simulación de análisis con progreso
    const progressSteps = [
      { step: 20, message: 'Analizando composición del portafolio...' },
      { step: 40, message: 'Evaluando diversificación...' },
      { step: 60, message: 'Calculando métricas de riesgo...' },
      { step: 80, message: 'Generando recomendaciones...' },
      { step: 100, message: 'Completando análisis...' }
    ];

    for (const { step } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step);
    }

    // Simulación de respuesta de IA
    const mockReport: AnalysisReportProps['report'] = {
      summary: `Basado en tu consulta "${query}", tu portafolio muestra una diversificación moderada con oportunidades de mejora. Se identificaron fortalezas en sectores tecnológicos y áreas de optimización en la distribución geográfica.`,
      riskLevel: 'medium' as const,
      diversificationScore: 72,
      performanceScore: 85,
      strengths: [
        'Buena exposición a sectores de crecimiento tecnológico',
        'Distribución equilibrada entre activos de alto y bajo riesgo',
        'Rendimiento superior al mercado en los últimos 12 meses'
      ],
      weaknesses: [
        'Concentración excesiva en el mercado estadounidense',
        'Falta de exposición a mercados emergentes',
        'Ausencia de activos defensivos para protección en volatilidad'
      ],
      recommendations: [
        'Considera diversificar geográficamente incluyendo ETFs de mercados emergentes',
        'Añade un 10-15% de bonos gubernamentales para reducir volatilidad',
        'Evalúa incluir REITs para diversificación sectorial',
        'Implementa una estrategia de rebalanceo trimestral'
      ]
    };

    setAnalysisReport(mockReport);
    setIsAnalyzing(false);
    onAnalysisComplete?.(mockReport);
  };

  const suggestedQueries = [
    "¿Cómo está diversificado mi portafolio?",
    "¿Cuál es el nivel de riesgo de mis inversiones?",
    "¿Qué activos debería considerar agregar?",
    "¿Cómo puedo optimizar mi estrategia de inversión?"
  ];

  return (
    <div className="space-y-6">
      {/* Analysis Input Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Análisis IA de Portafolio
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Obtén insights personalizados y recomendaciones avanzadas para optimizar tu portafolio de inversiones.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">¿Qué te gustaría analizar?</label>
            <Textarea
              placeholder="Ejemplo: ¿Cómo puedo mejorar la diversificación de mi portafolio? ¿Cuáles son los riesgos principales?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none border-0 bg-background/50 backdrop-blur-sm"
              disabled={isAnalyzing}
            />
          </div>

          {/* Suggested Queries */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Consultas sugeridas:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-background/50 hover:bg-background/80"
                  onClick={() => setQuery(suggestion)}
                  disabled={isAnalyzing}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analizando...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAnalysis}
            disabled={!query.trim() || isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Iniciar Análisis IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rendimiento</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diversificación</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">72/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Riesgo</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">Moderado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysisReport && (
        <AnalysisReport report={analysisReport} />
      )}
    </div>
  );
}
