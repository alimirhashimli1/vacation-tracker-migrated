import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client';
import type { User } from '../types/user';

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => client.get<User[]>('/users'),
  });
};
