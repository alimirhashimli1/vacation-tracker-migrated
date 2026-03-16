import React from 'react';
import { useMyAbsences } from '../../hooks/useAbsences';
import StatusBadge from '../../components/StatusBadge';

const AbsenceHistory = () => {
  const { data: absences, isLoading, error } = useMyAbsences();

  if (isLoading) return <div className="mt-4 text-gray-500">Loading history...</div>;
  if (error) return <div className="mt-4 text-red-500">Error loading absence history.</div>;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900">Your Absence History</h2>
      <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Days</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {absences?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-sm text-center text-gray-500">No absence requests found.</td>
              </tr>
            ) : (
              absences?.map((absence) => (
                <tr key={absence.id}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{absence.type}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(absence.startDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(absence.endDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{absence.requestedDays}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge status={absence.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbsenceHistory;
