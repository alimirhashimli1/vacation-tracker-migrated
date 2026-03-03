import { Role } from '../shared/role.enum';
import { Absence } from '../absence/absence.entity';
import { Invitation } from '../invitations/invitations.entity';
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: Role;
    isActive: boolean;
    emailVerified: boolean;
    region: string;
    createdAt: Date;
    updatedAt: Date;
    absences: Absence[];
    invitations: Invitation[];
}
