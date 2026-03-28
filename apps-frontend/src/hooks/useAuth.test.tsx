import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from './useAuth';
import { client } from '../api/client';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import React from 'react';

// Mock dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLogin hook', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as any).mockReturnValue(dispatch);
  });

  it('dispatches setCredentials upon receiving a successful response from the server', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockResponse = { user: mockUser, access_token: 'secret-token' };
    (client.post as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    const credentials = { email: 'test@example.com', password: 'password123' };
    await result.current.mutateAsync(credentials);

    expect(client.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(dispatch).toHaveBeenCalledWith(
      setCredentials({
        user: mockUser,
        token: 'secret-token',
      })
    );
  });
});
