import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  region: string;
}

export const useHolidays = (start?: string, end?: string, region: string = 'DE') => {
  return useQuery<Holiday[]>({
    queryKey: ['holidays', start, end, region],
    queryFn: () => {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      params.append('region', region);
      return client.get<Holiday[]>(`/holidays?${params.toString()}`);
    },
    enabled: !!start && !!end,
  });
};
