'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import type { PortfolioAnalysisOutput } from '@/ai/flows/portfolio-analysis';
import { Button } from './ui/button';
import { Download, FileText, CheckCircle, BarChart2, Lightbulb, Bot } from 'lucide-react';

interface AnalysisReportProps {
  result: PortfolioAnalysisOutput | null;
  isLoading: boolean;
}

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
        <h3 className="font-headline flex items-center gap-2 text-base font-semibold mb-2 mt-0">
            {icon}
            {title}
        </h3>
        <div className="text-muted-foreground text-sm">{children}</div>
    </div>
);

const ReportSkeleton = () => (
    <Card className="h-full flex flex-col justify-center">
        <CardHeader>
            <CardTitle className="font-headline">Generando Análisis...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full mt-4" />
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <Card className="h-full flex items-center justify-center">
        <div className="text-center p-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium font-headline">Informe de Análisis de IA</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Tu informe generado aparecerá aquí.
            </p>
        </div>
    </Card>
);

export function AnalysisReport({ result, isLoading }: AnalysisReportProps) {
  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (!result) {
    return <EmptyState />;
  }

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card/80 backdrop-blur-sm z-10">
        <div className="space-y-1.5">
          <CardTitle className="font-headline">Informe de Análisis</CardTitle>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger className="font-headline text-base">Resumen Ejecutivo</AccordionTrigger>
                <AccordionContent>
                    <SectionCard icon={<FileText className="h-5 w-5 text-primary" />} title="Resumen">
                        {result.executiveSummary.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </SectionCard>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger className="font-headline text-base">Análisis Cuantitativo</AccordionTrigger>
                <AccordionContent>
                    <SectionCard icon={<BarChart2 className="h-5 w-5 text-primary" />} title="En Cifras">
                        {result.quantitativeAnalysis.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </SectionCard>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger className="font-headline text-base">Análisis Cualitativo</AccordionTrigger>
                <AccordionContent>
                    <SectionCard icon={<CheckCircle className="h-5 w-5 text-primary" />} title="Información por Emisor">
                       {result.qualitativeAnalysis.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </SectionCard>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger className="font-headline text-base">Visualizaciones Sugeridas</AccordionTrigger>
                <AccordionContent>
                    <SectionCard icon={<Lightbulb className="h-5 w-5 text-primary" />} title="Ideas de Visualización de Datos">
                       {result.suggestedVisualizations.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </SectionCard>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
                <AccordionTrigger className="font-headline text-base">Conclusiones y Recomendaciones</AccordionTrigger>
                <AccordionContent>
                    <SectionCard icon={<FileText className="h-5 w-5 text-primary" />} title="Recomendaciones Estratégicas">
                       {result.conclusionsAndRecommendations.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </SectionCard>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
