import { http, HttpResponse } from 'msw';
import { AbsenceStatus, AbsenceType } from '../types/absence';
import { Role } from '../types/role';

const BASE_URL = 'http://localhost:3000';

const mockUser = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: Role.Employee,
  isActive: true,
  emailVerified: true,
  region: 'DE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAdmin = {
  id: 'admin-123',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: Role.Admin,
  isActive: true,
  emailVerified: true,
  region: 'DE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAbsences = [
  {
    id: 'absence-1',
    userId: 'user-123',
    startDate: '2026-05-01T00:00:00.000Z',
    endDate: '2026-05-05T00:00:00.000Z',
    type: AbsenceType.VACATION,
    status: AbsenceStatus.APPROVED,
    isHalfDay: false,
    requestedDays: 3,
    approvedDays: 3,
    totalHours: 24,
    cost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: mockUser,
  },
  {
    id: 'absence-2',
    userId: 'user-123',
    startDate: '2026-06-10T00:00:00.000Z',
    endDate: '2026-06-10T00:00:00.000Z',
    type: AbsenceType.SICK_LEAVE,
    status: AbsenceStatus.PENDING,
    isHalfDay: true,
    requestedDays: 0.5,
    approvedDays: 0,
    totalHours: 4,
    cost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: mockUser,
  },
];

export const handlers = [
  // Auth Handlers
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const { email } = (await request.json()) as any;

    if (email === 'admin@example.com') {
      return HttpResponse.json({
        user: mockAdmin,
        access_token: 'mock-admin-token',
      });
    }

    return HttpResponse.json({
      user: mockUser,
      access_token: 'mock-user-token',
    });
  }),

  http.get(`${BASE_URL}/auth/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer mock-admin-token') {
      return HttpResponse.json(mockAdmin);
    }
    return HttpResponse.json(mockUser);
  }),

  // Absence Handlers
  http.get(`${BASE_URL}/absences/me`, () => {
    return HttpResponse.json(mockAbsences);
  }),

  http.get(`${BASE_URL}/absences/balance`, () => {
    return HttpResponse.json({
      remaining: 25,
      allowance: 30,
      used: 5,
      year: 2026,
    });
  }),

  http.get(`${BASE_URL}/absences`, () => {
    return HttpResponse.json(mockAbsences);
  }),

  http.post(`${BASE_URL}/absences`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      ...body,
      id: `absence-${Math.random()}`,
      status: AbsenceStatus.PENDING,
      requestedDays: 1,
      approvedDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.patch(`${BASE_URL}/absences/:id`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // User Handlers
  http.get(`${BASE_URL}/users`, () => {
    return HttpResponse.json([mockUser, mockAdmin]);
  }),

  http.post(`${BASE_URL}/invitations`, () => {
    return HttpResponse.json({ message: 'Invitation sent' }, { status: 201 });
  }),

  http.get(`${BASE_URL}/holidays`, () => {
    return HttpResponse.json([]);
  }),
];
