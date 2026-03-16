import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache, Mutation, Query } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { store } from './store';
import { FetchError } from './api/client';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App.tsx';

interface CustomMeta {
  successMessage?: string;
  skipErrorToast?: boolean;
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation: Mutation<unknown, unknown, unknown, unknown>) => {
      const meta = mutation.meta as CustomMeta;
      if (meta?.successMessage) {
        toast.success(meta.successMessage);
      }
    },
    onError: (error, _variables, _context, mutation: Mutation<unknown, unknown, unknown, unknown>) => {
      const meta = mutation.meta as CustomMeta;
      if (meta?.skipErrorToast) return;

      const message = error instanceof FetchError 
        ? error.error?.message 
        : error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast.error(message);
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query: Query<unknown, unknown, unknown, unknown>) => {
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
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
