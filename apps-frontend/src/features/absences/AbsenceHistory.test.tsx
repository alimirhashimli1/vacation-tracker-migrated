import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AbsenceHistory from './AbsenceHistory';
import { AbsenceStatus } from '../../types/absence';
import { Role } from '../../types/role';
import { useSelector } from 'react-redux';
import { useAllAbsences, useCancelAbsence, useDeleteAbsence } from '../../hooks/useAbsences';

// Mock dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('../../hooks/useAbsences', () => ({
  useAllAbsences: vi.fn(),
  useCancelAbsence: vi.fn(),
  useDeleteAbsence: vi.fn(),
}));

// Mock StatusBadge to simplify
vi.mock('../../components/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

describe('AbsenceHistory', () => {
  const mockCurrentUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.Employee,
  };

  const mockAbsences = [
    {
      id: 'abs-1',
      userId: 'user-1', // Own request
      type: 'VACATION',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      requestedDays: 2,
      status: AbsenceStatus.PENDING,
      user: mockCurrentUser,
    },
    {
      id: 'abs-2',
      userId: 'user-2', // Other's request
      type: 'SICK_LEAVE',
      startDate: '2026-04-05',
      endDate: '2026-04-05',
      requestedDays: 1,
      status: AbsenceStatus.APPROVED,
      user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSelector as any).mockReturnValue(mockCurrentUser);
    (useAllAbsences as any).mockReturnValue({ data: mockAbsences, isLoading: false, error: null });
    (useCancelAbsence as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
    (useDeleteAbsence as any).mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders the "Me" badge only for the current user\'s requests', () => {
    render(<AbsenceHistory />);
    
    // Should have exactly one "Me" badge
    const meBadges = screen.getAllByText('Me');
    expect(meBadges).toHaveLength(1);
    
    // Should show Jane Smith for the second request
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders the "Cancel" button only for PENDING requests belonging to the current user', () => {
    render(<AbsenceHistory />);
    
    // "abs-1" is PENDING and belongs to me -> Should have Cancel
    const cancelButtons = screen.getAllByText('Cancel');
    expect(cancelButtons).toHaveLength(1);
    
    // "abs-2" is APPROVED -> Should not have Cancel
    // (Total cancel buttons in document is 1)
  });

  it('does NOT render the "Delete" button for an Employee', () => {
    render(<AbsenceHistory />);
    
    const deleteButtons = screen.queryByText('Delete');
    expect(deleteButtons).not.toBeInTheDocument();
  });

  it('renders the "Delete" button for an Admin on ALL requests', () => {
    (useSelector as any).mockReturnValue({ ...mockCurrentUser, role: Role.Admin });
    
    render(<AbsenceHistory />);
    
    // Both requests should have a Delete button
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('renders the "Delete" button for a SuperAdmin on ALL requests', () => {
    (useSelector as any).mockReturnValue({ ...mockCurrentUser, role: Role.SuperAdmin });
    
    render(<AbsenceHistory />);
    
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('shows "Unknown User" if absence.user is missing and it\'s not the current user', () => {
    const incompleteAbsence = {
      ...mockAbsences[1],
      user: undefined,
    };
    (useAllAbsences as any).mockReturnValue({ data: [incompleteAbsence], isLoading: false, error: null });
    
    render(<AbsenceHistory />);
    expect(screen.getByText('Unknown User')).toBeInTheDocument();
  });
});
