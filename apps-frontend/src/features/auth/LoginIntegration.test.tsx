import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { renderWithProviders } from '../../test-utils';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Auth Integration', () => {
  it('should login successfully and redirect to dashboard', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<App Router={MemoryRouter} />, {
        router: React.Fragment
    });

    // Should start at login page
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();

    // Fill login form
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should redirect to dashboard and show welcome message
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Use getByRole to avoid ambiguity with the "Dashboard" link in Nav
    expect(screen.getByRole('heading', { name: /Dashboard/i, level: 1 })).toBeInTheDocument();
    
    // Verify token is in localStorage
    expect(localStorage.getItem('token')).toBe('mock-user-token');
  });

  it('should maintain session on reload if token exists', async () => {
    // Simulate existing token in localStorage
    localStorage.setItem('token', 'mock-user-token');

    renderWithProviders(<App Router={MemoryRouter} />, {
        router: React.Fragment
    });

    // MSW handler for /auth/profile will return John Doe for this token
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByRole('heading', { name: /Dashboard/i, level: 1 })).toBeInTheDocument();
  });

  it('should redirect to login if token is invalid or profile fetch fails', async () => {
      // Simulate existing but "invalid" token
      localStorage.setItem('token', 'invalid-token');
      
      server.use(
        http.get('http://localhost:3000/auth/profile', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      renderWithProviders(<App Router={MemoryRouter} />, {
          router: React.Fragment
      });

      // Should eventually redirect to login
      await waitFor(() => {
        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Token should be cleared by the logout action triggered on error
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });
  });
});
