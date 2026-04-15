import React, { useState } from 'react';
import { useAllAbsences, useUpdateAbsenceStatus } from '../../hooks/useAbsences';
import { AbsenceStatus } from '../../types/absence';
import { Check, X, Loader2 } from 'lucide-react';

const AbsenceManagement = () => {
  const { data: absences, isLoading, error: absencesError } = useAllAbsences();
  const updateStatusMutation = useUpdateAbsenceStatus();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (isLoading) return <div className="mt-4 text-gray-500">Loading requests...</div>;
  if (absencesError) return <div className="mt-4 text-red-500">Error loading absence requests.</div>;

  const pendingAbsences = absences?.filter(a => a.status === AbsenceStatus.PENDING) || [];

  const handleUpdateStatus = (id: string, status: AbsenceStatus) => {
    setProcessingId(id);
    updateStatusMutation.mutate({ id, status }, {
      onSettled: () => {
        setProcessingId(null);
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Pending Absence Requests</h2>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {pendingAbsences.length} pending
        </span>
      </div>
      
      <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Employee</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dates</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">Working Days</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pendingAbsences.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-sm text-center text-gray-500 italic">No pending requests to manage.</td>
              </tr>
            ) : (
              pendingAbsences.map((absence) => (
                <tr key={absence.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    {absence.user ? `${absence.user.firstName} ${absence.user.lastName}` : 'Unknown User'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{absence.type}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(absence.startDate).toLocaleDateString()} - {new Date(absence.endDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                    {absence.requestedDays}
                    {absence.isHalfDay && (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Half-day
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateStatus(absence.id, AbsenceStatus.APPROVED)}
                        disabled={updateStatusMutation.isPending && processingId === absence.id}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-green-700 shadow-sm ring-1 ring-inset ring-green-600/20 hover:bg-green-50 disabled:opacity-50 transition-all"
                      >
                        {updateStatusMutation.isPending && processingId === absence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(absence.id, AbsenceStatus.REJECTED)}
                        disabled={updateStatusMutation.isPending && processingId === absence.id}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-600/20 hover:bg-red-50 disabled:opacity-50 transition-all"
                      >
                        {updateStatusMutation.isPending && processingId === absence.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </div>
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

export default AbsenceManagement;
