import { Role } from '../shared/role.enum';
import { InvitationStatus } from '../shared/invitation-status.enum';
import { User } from '../users/user.entity';
export declare class Invitation {
    id: string;
    email: string;
    role: Role;
    token: string;
    expiresAt: Date;
    usedAt?: Date;
    status: InvitationStatus;
    invitedById: string;
    invitedBy: User;
    createdAt: Date;
    updatedAt: Date;
}
