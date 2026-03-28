import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge';
import { AbsenceStatus } from '../types/absence';

describe('StatusBadge', () => {
  it('renders the correct text for PENDING status', () => {
    render(<StatusBadge status={AbsenceStatus.PENDING} />);
    expect(screen.getByText(AbsenceStatus.PENDING)).toBeInTheDocument();
  });

  it('renders the correct text for APPROVED status', () => {
    render(<StatusBadge status={AbsenceStatus.APPROVED} />);
    expect(screen.getByText(AbsenceStatus.APPROVED)).toBeInTheDocument();
  });

  it('renders the correct text for REJECTED status', () => {
    render(<StatusBadge status={AbsenceStatus.REJECTED} />);
    expect(screen.getByText(AbsenceStatus.REJECTED)).toBeInTheDocument();
  });

  it('applies yellow classes for PENDING status', () => {
    const { container } = render(<StatusBadge status={AbsenceStatus.PENDING} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-yellow-50');
    expect(badge).toHaveClass('text-yellow-700');
    expect(badge).toHaveClass('ring-yellow-600/20');
  });

  it('applies green classes for APPROVED status', () => {
    const { container } = render(<StatusBadge status={AbsenceStatus.APPROVED} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-green-50');
    expect(badge).toHaveClass('text-green-700');
    expect(badge).toHaveClass('ring-green-600/20');
  });

  it('applies red classes for REJECTED status', () => {
    const { container } = render(<StatusBadge status={AbsenceStatus.REJECTED} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-red-50');
    expect(badge).toHaveClass('text-red-700');
    expect(badge).toHaveClass('ring-red-600/20');
  });

  it('applies gray classes for unknown status', () => {
    // @ts-ignore - Testing fallback for unknown status
    const { container } = render(<StatusBadge status="UNKNOWN" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-gray-50');
    expect(badge).toHaveClass('text-gray-700');
    expect(badge).toHaveClass('ring-gray-600/20');
  });
});
