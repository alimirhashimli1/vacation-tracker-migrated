import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyAbsences, useDeleteAbsence } from './useAbsences';
import { client } from '../api/client';
import React from 'react';

// Mock the API client
vi.mock('../api/client', () => ({
  client: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAbsences hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMyAbsences', () => {
    it('correctly calls the /absences/me endpoint', async () => {
      const mockData = [{ id: '1', type: 'VACATION' }];
      (client.get as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useMyAbsences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(client.get).toHaveBeenCalledWith('/absences/me');
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useDeleteAbsence', () => {
    it('triggers a query invalidation upon successful deletion', async () => {
      (client.delete as any).mockResolvedValue(undefined);
      
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteAbsence(), {
        wrapper,
      });

      await result.current.mutateAsync('abs-123');

      expect(client.delete).toHaveBeenCalledWith('/absences/abs-123');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['absences'] });
    });
  });
});
