import { AbsenceType } from './absence-type.enum';
import { AbsenceStatus } from './absence-status.enum';
export declare class CreateAbsenceDto {
    userId: string;
    startDate: string;
    endDate: string;
    type: AbsenceType;
    totalHours: number;
    cost: number;
}
export declare class AbsenceResponseDto {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    type: AbsenceType;
    status: AbsenceStatus;
    requestedDays: number;
    approvedDays: number;
    totalHours: number;
    cost: number;
    createdAt: Date;
    updatedAt: Date;
}
