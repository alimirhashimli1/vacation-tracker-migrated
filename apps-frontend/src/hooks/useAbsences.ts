import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, type FetchError } from '../api/client';
import type { AbsenceResponse, AbsenceStatus } from '../types/absence';

export const useMyAbsences = () => {
  return useQuery<AbsenceResponse[], FetchError>({
    queryKey: ['absences', 'me'],
    queryFn: () => client.get<AbsenceResponse[]>('/absences/me'),
  });
};

export const useAllAbsences = () => {
  return useQuery<AbsenceResponse[], FetchError>({
    queryKey: ['absences', 'all'],
    queryFn: () => client.get<AbsenceResponse[]>('/absences'),
  });
};

export const useUpdateAbsenceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<AbsenceResponse, FetchError, { id: string; status: AbsenceStatus }>({
    mutationFn: ({ id, status }) =>
      client.patch<AbsenceResponse>(`/absences/${id}/status`, { status }),
    onSuccess: () => {
      // Invalidate both current user's history and all-absences manager view
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
    meta: {
      successMessage: 'Status updated successfully!',
    },
  });
};
