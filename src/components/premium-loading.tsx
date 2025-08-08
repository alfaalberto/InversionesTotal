'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, TrendingUp } from 'lucide-react';

export function PremiumTableSkeleton() {
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table header skeleton */}
          <div className="grid grid-cols-7 gap-4 py-3 border-b">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          
          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-3">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumChartSkeleton() {
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumLoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-muted animate-spin border-t-primary"></div>
        <TrendingUp className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export function PremiumAnalysisLoading() {
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800 animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              Analizando tu portafolio...
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Nuestro sistema de IA está procesando tus datos para generar insights personalizados y recomendaciones avanzadas.
            </p>
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
