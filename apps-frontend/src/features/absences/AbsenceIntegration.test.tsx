import React from 'react';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { renderWithProviders } from '../../test-utils';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { Role } from '../../types/role';

describe('Absence Integration', () => {
  const adminToken = 'mock-admin-token';
  const mockAdmin = {
    id: 'admin-123',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: Role.Admin,
    isActive: true,
    emailVerified: true,
    region: 'DE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const renderAsAdmin = () => {
    return renderWithProviders(
      <App Router={(props) => <MemoryRouter initialEntries={['/dashboard']} {...props} />} />, 
      {
        router: React.Fragment,
        preloadedState: {
          auth: {
            user: mockAdmin,
            token: adminToken,
            isAuthenticated: true,
            isLoading: false,
          }
        }
      }
    );
  };

  const getFutureDates = () => {
      const start = new Date();
      start.setDate(start.getDate() + 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 4);
      
      return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
      };
  };

  it('should fetch and display absences on the dashboard for an admin', async () => {
    renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User!/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    const managementHeading = await screen.findByRole('heading', { name: /Pending Absence Requests/i });
    expect(managementHeading).toBeInTheDocument();
    
    const managementSection = managementHeading.closest('div')?.parentElement;
    expect(within(managementSection!).getByText(/Sick Leave/i)).toBeInTheDocument();
  });

  it('should open the request modal and submit a new absence', async () => {
    const user = userEvent.setup();
    renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User!/i)).toBeInTheDocument();
    });

    const requestBtn = screen.getByRole('button', { name: /Request Absence/i });
    await user.click(requestBtn);

    expect(screen.getByRole('heading', { name: /Request Absence/i, level: 3 })).toBeInTheDocument();

    const { start, end } = getFutureDates();

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: start } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: end } });
    
    // Type is already Vacation by default
    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Request Absence/i, level: 3 })).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display error message when fetching absences fails (500)', async () => {
    server.use(
      http.get('http://localhost:3000/absences', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Error loading absence requests./i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display error message when creating absence fails (400)', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('http://localhost:3000/absences', () => {
        return HttpResponse.json({ message: 'Vacation balance exceeded' }, { status: 400 });
      })
    );

    renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User!/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Request Absence/i }));
    
    const { start, end } = getFutureDates();
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: start } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: end } });
    
    await user.click(screen.getByRole('button', { name: /Submit Request/i }));

    // Should show error toast
    // Note: react-hot-toast creates a div outside of the main app container
    // so we search the whole screen
    await waitFor(() => {
      expect(screen.getByText(/Vacation balance exceeded/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display error message when updating absence status fails (400)', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.patch('http://localhost:3000/absences/:id/status', () => {
        return HttpResponse.json({ message: 'Cannot approve request: Insufficient balance' }, { status: 400 });
      })
    );

    renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Admin User!/i)).toBeInTheDocument();
    });

    const approveBtn = await screen.findByRole('button', { name: /Approve/i });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cannot approve request: Insufficient balance/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
