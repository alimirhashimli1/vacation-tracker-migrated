import { AbsenceType } from '../shared/absence-type.enum';
import { AbsenceStatus } from '../shared/absence-status.enum';
import { User } from '../users/user.entity';
export declare class Absence {
    id: string;
    userId: string;
    user: User;
    startDate: Date;
    endDate: Date;
    type: AbsenceType;
    status: AbsenceStatus;
    requestedDays: number;
    approvedDays: number;
    totalHours: number;
    cost: number;
    createdAt: Date;
    updatedAt: Date;
}
