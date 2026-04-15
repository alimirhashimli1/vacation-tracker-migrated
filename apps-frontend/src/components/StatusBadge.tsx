import React from 'react';
import { AbsenceStatus } from '../types/absence';

interface StatusBadgeProps {
  status: AbsenceStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case AbsenceStatus.PENDING:
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case AbsenceStatus.APPROVED:
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case AbsenceStatus.REJECTED:
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getBadgeStyles()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
