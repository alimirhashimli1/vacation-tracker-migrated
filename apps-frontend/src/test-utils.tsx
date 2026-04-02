import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache, Mutation, Query } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { setupStore, RootState } from './store';
import { FetchError } from './api/client';
import toast from 'react-hot-toast';

interface CustomMeta {
  successMessage?: string;
  skipErrorToast?: boolean;
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: any;
  router?: React.ComponentType<{ children: React.ReactNode }>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    router: Router = BrowserRouter,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation: Mutation<any, any, any, any>) => {
        const meta = mutation.meta as CustomMeta;
        if (meta?.successMessage) {
          toast.success(meta.successMessage);
        }
      },
      onError: (error, _variables, _context, mutation: Mutation<any, any, any, any>) => {
        const meta = mutation.meta as CustomMeta;
        if (meta?.skipErrorToast) return;
  
        const message = error instanceof FetchError 
          ? error.error?.message 
          : error instanceof Error ? error.message : 'An unexpected error occurred';
        
        toast.error(message);
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query: Query<any, any, any, any>) => {
        const meta = query.meta as CustomMeta;
        if (meta?.skipErrorToast) return;
  
        const message = error instanceof FetchError 
          ? error.error?.message 
          : error instanceof Error ? error.message : 'Failed to fetch data';
        
        toast.error(message);
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }): ReactElement {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Router>
            {children}
          </Router>
        </QueryClientProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
