'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Target,
  Shield,
  Zap
} from 'lucide-react';

export interface AnalysisReportProps {
  report: {
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
    diversificationScore: number;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
    performanceScore: number;
  };
}

export function AnalysisReport({ report }: AnalysisReportProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Análisis IA Completado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {report.summary}
          </p>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Level */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nivel de Riesgo</p>
                <Badge className={`mt-1 ${getRiskColor(report.riskLevel)}`}>
                  {getRiskIcon(report.riskLevel)}
                  <span className="ml-1 capitalize">{report.riskLevel}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Puntuación de Rendimiento</p>
                <span className="text-sm font-bold">{report.performanceScore}/100</span>
              </div>
              <Progress value={report.performanceScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diversification Score */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Diversificación del Portafolio
              </p>
              <span className="text-sm font-bold">{report.diversificationScore}/100</span>
            </div>
            <Progress value={report.diversificationScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {report.diversificationScore >= 80 ? 'Excelente diversificación' :
               report.diversificationScore >= 60 ? 'Buena diversificación' :
               report.diversificationScore >= 40 ? 'Diversificación moderada' :
               'Necesita más diversificación'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Fortalezas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            Áreas de Mejora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
            <Zap className="h-4 w-4" />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <span className="text-sm leading-relaxed">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
