import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import RequestAbsenceModal from '../absences/RequestAbsenceModal';
import AbsenceHistory from '../absences/AbsenceHistory';
import AbsenceManagement from '../absences/AbsenceManagement';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { Role } from '../../types/role';

const DashboardPage = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const currentUser = useSelector(selectCurrentUser);

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

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-500 truncate">Role</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{currentUser?.role}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-500 truncate">Email</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{currentUser?.email}</p>
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
