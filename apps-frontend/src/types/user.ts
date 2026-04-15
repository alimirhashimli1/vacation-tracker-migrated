import type { Role } from './role';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  region: string;
  createdAt: string;
  updatedAt: string;
}
