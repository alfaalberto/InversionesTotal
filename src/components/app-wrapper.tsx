'use client';

import * as React from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
          {children}
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
