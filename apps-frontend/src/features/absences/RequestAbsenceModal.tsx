import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { client, type FetchError } from '../../api/client';
import { AbsenceType, type CreateAbsenceDto, type AbsenceResponse, AbsenceStatus } from '../../types/absence';
import { selectCurrentUser } from '../../store/authSlice';
import { useHolidays } from '../../hooks/useHolidays';
import { useMyAbsences } from '../../hooks/useAbsences';
import toast from 'react-hot-toast';

const absenceSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.nativeEnum(AbsenceType, {
    message: 'Please select a valid absence type',
  }),
  isHalfDay: z.boolean().default(false),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date cannot be before start date",
  path: ["endDate"],
}).refine((data) => {
  if (data.isHalfDay) {
    return data.startDate === data.endDate;
  }
  return true;
}, {
  message: "Half-day requests must be for a single day",
  path: ["endDate"],
});

type AbsenceFormData = z.infer<typeof absenceSchema>;

interface RequestAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const estimateWorkingDays = (start: string, end: string, holidays: string[] = [], isHalfDay: boolean = false): { working: number; total: number; holidayCount: number } => {
  if (!start || !end) return { working: 0, total: 0, holidayCount: 0 };
  
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);
  
  if (startDate > endDate) return { working: 0, total: 0, holidayCount: 0 };

  let working = 0;
  let total = 0;
  let holidayCount = 0;
  const curr = new Date(startDate);
  
  while (curr <= endDate) {
    total++;
    const day = curr.getDay();
    const isWeekend = day === 0 || day === 6;
    
    // Format current date as YYYY-MM-DD for comparison
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const isHoliday = holidays.includes(dateStr);

    if (isHoliday && !isWeekend) {
        holidayCount++;
    }

    if (!isWeekend && !isHoliday) {
      working++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  const finalWorking = isHalfDay ? working * 0.5 : working;
  return { working: finalWorking, total, holidayCount };
};

const RequestAbsenceModal: React.FC<RequestAbsenceModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector(selectCurrentUser);
  const { data: myAbsences } = useMyAbsences();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      type: AbsenceType.VACATION,
      isHalfDay: false,
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');

  // Fetch holidays for the selected range to provide accurate preview
  const { data: holidays } = useHolidays(
    startDate, 
    endDate, 
    currentUser?.region
  );

  const holidayDates = useMemo(() => {
    return (holidays || []).map(h => h.date.split('T')[0]);
  }, [holidays]);

  const estimates = useMemo(() => {
    return estimateWorkingDays(startDate, endDate, holidayDates, isHalfDay);
  }, [startDate, endDate, holidayDates, isHalfDay]);

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
    // Client-side overlap validation
    if (myAbsences) {
      const newStart = parseDateString(data.startDate);
      const newEnd = parseDateString(data.endDate);

      const isOverlapping = myAbsences.some(existing => {
        if (existing.status !== AbsenceStatus.APPROVED && existing.status !== AbsenceStatus.PENDING) {
          return false;
        }

        const existingStart = parseDateString(existing.startDate.split('T')[0]);
        const existingEnd = parseDateString(existing.endDate.split('T')[0]);

        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        return (newStart <= existingEnd && newEnd >= existingStart);
      });

      if (isOverlapping) {
        toast.error('This request overlaps with an existing pending or approved absence.');
        return;
      }
    }

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

        <div className="flex items-center">
          <input
            {...register('isHalfDay')}
            type="checkbox"
            id="isHalfDay"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isHalfDay" className="ml-2 block text-sm text-gray-900">
            Half-day request
          </label>
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

        {startDate && endDate && estimates.total > 0 && (
          <div className="rounded-md bg-blue-50 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Calendar className="h-4 w-4" />
              <span>Total duration: <strong>{estimates.total}</strong> calendar days</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock className="h-4 w-4" />
              <span>Deducted balance: <strong>{estimates.working}</strong> working days {isHalfDay ? '(Half-day)' : '(Mon–Fri)'}</span>
            </div>
            <p className="text-[10px] text-blue-600 italic">* Final calculation including public holidays will be performed by the backend.</p>
          </div>
        )}

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
