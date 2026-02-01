/**
 * App Providers
 *
 * Global providers for the application.
 * Wraps the app with necessary context providers.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import * as React from 'react';
import { queryClient } from '../../lib/query-client';
import { router } from '../routes';

interface AppProvidersProps {
  children?: React.ReactNode;
}

/**
 * Root providers component that wraps the entire application
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Router provider with app providers
 */
export function AppWithRouter() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
