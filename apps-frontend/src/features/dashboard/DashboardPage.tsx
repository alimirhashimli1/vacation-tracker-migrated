import React, { useState } from 'react';
import { Calendar, Briefcase, Clock, CheckCircle } from 'lucide-react';
import RequestAbsenceModal from '../absences/RequestAbsenceModal';
import AbsenceHistory from '../absences/AbsenceHistory';
import AbsenceManagement from '../absences/AbsenceManagement';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { Role } from '../../types/role';
import { useAbsenceBalance } from '../../hooks/useAbsences';

const DashboardPage = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const currentUser = useSelector(selectCurrentUser);
  const { data: balance } = useAbsenceBalance();

  const isManager = currentUser?.role === Role.Admin || currentUser?.role === Role.SuperAdmin;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, {currentUser?.firstName} {currentUser?.lastName}!
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Calendar className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Request Absence
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-2">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Accumulated</dt>
                  <dd className="text-lg font-semibold text-gray-900">{balance?.allowance ?? '--'} days</dd>
                </dl>
                </div>
                </div>
                {balance && balance.allowance > 30 && (
                <div className="mt-2 text-[10px] text-green-600 font-medium">
                * Includes previous years' carryover
                </div>
                )}
                </div>
                </div>


        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-500 rounded-md p-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Used Days</dt>
                  <dd className="text-lg font-semibold text-gray-900">{balance?.used ?? '--'} days</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Remaining Balance</dt>
                  <dd className="text-lg font-semibold text-gray-900">{balance?.remaining ?? '--'} days</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-500 rounded-md p-2">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Year</dt>
                  <dd className="text-lg font-semibold text-gray-900">{balance?.year ?? new Date().getFullYear()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isManager && <AbsenceManagement />}
      
      <AbsenceHistory />

      <RequestAbsenceModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
