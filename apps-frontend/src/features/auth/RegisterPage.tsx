import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { client, type FetchError } from '../../api/client';
import type { Role } from '../../types/role';
import type { User } from '../../types/user';
import { setCredentials } from '../../store/authSlice';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface VerifyResponse {
  email: string;
  role: Role;
}

interface RegisterResponse {
  message: string;
  user: User;
  access_token: string;
}

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: invitation, isLoading: isVerifying, isError: isTokenInvalid, error: verifyError } = useQuery<VerifyResponse, FetchError>({
    queryKey: ['verify-token', token],
    queryFn: () => {
      console.log(`[Frontend] Verifying token: "${token}"`);
      return client.get<VerifyResponse>(`/invitations/verify/${token}`);
    },
    enabled: !!token,
    retry: false,
  });

  if (isTokenInvalid) {
    console.error('[Frontend] Token verification failed:', verifyError);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation<RegisterResponse, FetchError, RegisterFormData>({
    mutationFn: (data) => client.post<RegisterResponse>('/auth/register', {
      token,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    }),
    onSuccess: (data) => {
      toast.success('Registration successful!');
      dispatch(
        setCredentials({
          user: data.user,
          token: data.access_token,
        })
      );
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.error?.message || 'Registration failed');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Invalid Invitation</h2>
          <p className="mt-2 text-gray-600">No invitation token provided. Please check your email link.</p>
          <Link to="/login" className="mt-6 inline-block text-indigo-600 font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (isTokenInvalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Invitation Expired</h2>
          <p className="mt-2 text-gray-600">This invitation is no longer valid or has already been used.</p>
          <Link to="/login" className="mt-6 inline-block text-indigo-600 font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Create Your Account
          </h2>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <span className="text-xs font-medium text-indigo-700">
              Joining as <span className="font-bold uppercase">{invitation?.role}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {invitation?.email}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register('firstName')}
                  type="text"
                  className={`block w-full pl-9 pr-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all ${
                    errors.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
              </div>
              {errors.firstName && <p className="mt-1 text-[10px] text-red-600 font-medium">{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register('lastName')}
                  type="text"
                  className={`block w-full pl-9 pr-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all ${
                    errors.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
              </div>
              {errors.lastName && <p className="mt-1 text-[10px] text-red-600 font-medium">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="password" title="At least 6 characters" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`block w-full pl-9 pr-10 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all ${
                  errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[10px] text-red-600 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" title="At least 6 characters" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`block w-full pl-9 pr-10 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all ${
                  errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-[10px] text-red-600 font-medium">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
          >
            {registerMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Complete Registration'
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            By clicking "Complete Registration", you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
