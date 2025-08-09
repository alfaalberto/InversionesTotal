"use client";

import * as React from "react";
import { useTheme } from "./theme-provider";
import { Moon, Sun, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

export function PremiumHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-background shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-lg font-headline font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            InversionesTotal
          </span>
          <span className="ml-2 hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Premium
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
