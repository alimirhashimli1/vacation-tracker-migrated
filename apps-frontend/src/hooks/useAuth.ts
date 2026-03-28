import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { 
  selectAuthToken, 
  selectCurrentUser, 
  setCredentials, 
  logout,
  setLoading 
} from '../store/authSlice';
import type { User } from '../types/user';

interface LoginResponse {
  user: User;
  access_token: string;
}

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: any) =>
      client.post<LoginResponse>('/auth/login', credentials),
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          token: data.access_token,
        })
      );
    },
  });
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);
  const user = useSelector(selectCurrentUser);

  const { data: profile, isLoading, error, isSuccess } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: () => client.get<User>('/auth/profile'),
    enabled: !!token && !user,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && profile) {
      dispatch(setCredentials({ user: profile, token: token! }));
    }
  }, [isSuccess, profile, dispatch, token]);

  useEffect(() => {
    if (error) {
      dispatch(logout());
    }
  }, [error, dispatch]);

  useEffect(() => {
    dispatch(setLoading(isLoading));
  }, [isLoading, dispatch]);

  return {
    user,
    isAuthenticated: !!token,
    isLoading,
  };
};
