'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  PieChart, 
  BarChart3, 
  Brain, 
  History, 
  Wallet,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PremiumTabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  className?: string;
}

export function PremiumTabs({ children, defaultValue = "resumen", className }: PremiumTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={`flex-1 space-y-6 ${className}`}>
      <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-muted/50 backdrop-blur-sm border shadow-sm">
        <TabsTrigger 
          value="resumen" 
          className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Resumen</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="graficos" 
          className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
        >
          <PieChart className="h-4 w-4" />
          <span className="hidden sm:inline">Gráficos</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="analisis" 
          className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Análisis IA</span>
          <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 h-5">
            AI
          </Badge>
        </TabsTrigger>
        
        <TabsTrigger 
          value="historico" 
          className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Histórico</span>
        </TabsTrigger>
      </TabsList>
      
      {children}
    </Tabs>
  );
}

// Premium Tab Content wrapper
export function PremiumTabContent({ 
  value, 
  children, 
  title,
  description,
  className 
}: {
  value: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <TabsContent value={value} className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </TabsContent>
  );
}
