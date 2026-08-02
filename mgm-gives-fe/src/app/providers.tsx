import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { HelmetProvider } from 'react-helmet-async';

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HelmetProvider>
  );
}
