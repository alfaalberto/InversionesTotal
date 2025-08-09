'use client';

import * as React from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/toaster';
import { TooltipProvider } from './ui/tooltip';
import { PremiumHeader } from './premium-header';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
          <PremiumHeader />
          {children}
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
