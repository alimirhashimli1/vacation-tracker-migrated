import type { User } from './user';

export enum AbsenceType {
  VACATION = 'Vacation',
  SICK_LEAVE = 'Sick Leave',
  PERSONAL_LEAVE = 'Personal Leave',
  MATERNITY_LEAVE = 'Maternity Leave',
  PATERNITY_LEAVE = 'Paternity Leave',
  BEREAVEMENT_LEAVE = 'Bereavement Leave',
}

export enum AbsenceStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export interface CreateAbsenceDto {
  userId: string;
  startDate: string; // ISO Date string
  endDate: string;   // ISO Date string
  type: AbsenceType;
  isHalfDay?: boolean;
  totalHours: number;
  cost: number;
}

export interface AbsenceResponse {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  status: AbsenceStatus;
  isHalfDay: boolean;
  requestedDays: number;
  approvedDays: number;
  totalHours: number;
  cost: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceBalanceResponse {
  remaining: number;
  allowance: number;
  used: number;
  year: number;
}
