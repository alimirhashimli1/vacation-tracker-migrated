import { CreateAbsenceDto } from './create-absence.dto';
import { AbsenceStatus } from './absence-status.enum';
import { AbsenceType } from './absence-type.enum';
declare const UpdateAbsenceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAbsenceDto>>;
export declare class UpdateAbsenceDto extends UpdateAbsenceDto_base {
    status?: AbsenceStatus;
    type?: AbsenceType;
    totalHours?: number;
    cost?: number;
    approvedDays?: number;
}
export {};
