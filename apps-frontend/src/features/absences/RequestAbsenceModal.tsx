import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Modal from '../../components/Modal';
import { client, type FetchError } from '../../api/client';
import { AbsenceType, type CreateAbsenceDto, type AbsenceResponse } from '../../types/absence';
import { selectCurrentUser } from '../../store/authSlice';

const absenceSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.nativeEnum(AbsenceType, {
    message: 'Please select a valid absence type',
  }),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type AbsenceFormData = z.infer<typeof absenceSchema>;

interface RequestAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestAbsenceModal: React.FC<RequestAbsenceModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector(selectCurrentUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      type: AbsenceType.VACATION,
    },
  });

  const createMutation = useMutation<AbsenceResponse, FetchError, AbsenceFormData>({
    mutationFn: (data: AbsenceFormData) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const payload: CreateAbsenceDto = {
        ...data,
        userId: currentUser.id,
        totalHours: 0, // Calculated by backend
        cost: 0,       // Calculated by backend
      };
      
      return client.post<AbsenceResponse>('/absences', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      reset();
      onClose();
    },
    meta: {
      successMessage: 'Absence request submitted successfully!',
    },
  });

  const onSubmit = (data: AbsenceFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Absence">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            {...register('startDate')}
            type="date"
            id="startDate"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.startDate ? 'border-red-500' : ''
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            {...register('endDate')}
            type="date"
            id="endDate"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.endDate ? 'border-red-500' : ''
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            {...register('type')}
            id="type"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.type ? 'border-red-500' : ''
            }`}
          >
            {Object.values(AbsenceType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestAbsenceModal;
