import React, { useState } from 'react';
import { useAllAbsences, useCancelAbsence, useDeleteAbsence } from '../../hooks/useAbsences';
import StatusBadge from '../../components/StatusBadge';
import { AbsenceStatus } from '../../types/absence';
import { XCircle, Loader2, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { Role } from '../../types/role';

const AbsenceHistory = () => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: allAbsences, isLoading, error } = useAllAbsences();
  const cancelMutation = useCancelAbsence();
  const deleteMutation = useDeleteAbsence();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (isLoading) return <div className="mt-4 text-gray-500">Loading history...</div>;
  if (error) return <div className="mt-4 text-red-500">Error loading absence history.</div>;

  const absences = allAbsences || [];

  const handleCancel = (id: string) => {
    setProcessingId(id);
    cancelMutation.mutate(id, {
      onSettled: () => setProcessingId(null),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this absence request?')) {
      setProcessingId(id);
      deleteMutation.mutate(id, {
        onSettled: () => setProcessingId(null),
      });
    }
  };

  const isAdmin = currentUser?.role === Role.Admin || currentUser?.role === Role.SuperAdmin;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900">Absence History</h2>
      <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Employee</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">End Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Working Days</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {absences.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-sm text-center text-gray-500">No absence requests found.</td>
              </tr>
            ) : (
              absences.map((absence) => (
                <tr key={absence.id} className={absence.userId === currentUser?.id ? 'bg-indigo-50/30' : undefined}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    {absence.userId === currentUser?.id ? (
                      <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">Me</span>
                    ) : (
                      absence.user ? `${absence.user.firstName} ${absence.user.lastName}` : 'Unknown User'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{absence.type}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(absence.startDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(absence.endDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {absence.requestedDays}
                    {absence.isHalfDay && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Half-day
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge status={absence.status} />
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-x-2">
                      {absence.userId === currentUser?.id && absence.status === AbsenceStatus.PENDING && (
                        <button
                          onClick={() => handleCancel(absence.id)}
                          disabled={(cancelMutation.isPending || deleteMutation.isPending) && processingId === absence.id}
                          className="inline-flex items-center gap-x-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Cancel Request"
                        >
                          {cancelMutation.isPending && processingId === absence.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Cancel</span>
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(absence.id)}
                          disabled={(cancelMutation.isPending || deleteMutation.isPending) && processingId === absence.id}
                          className="inline-flex items-center gap-x-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete Absence (Admin)"
                        >
                          {deleteMutation.isPending && processingId === absence.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
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

export default AbsenceHistory;
