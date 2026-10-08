'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { StoreProvider } from '@/store/provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <StoreProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </StoreProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
