import { Request } from 'express';
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto, AbsenceResponseDto } from '../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../shared/update-absence.dto';
import { UpdateAbsenceStatusDto } from '../shared/update-absence-status.dto';
import { Role } from '../shared/role.enum';
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: Role;
    };
}
export declare class AbsenceController {
    private readonly absenceService;
    constructor(absenceService: AbsenceService);
    create(req: AuthenticatedRequest, createAbsenceDto: CreateAbsenceDto): Promise<AbsenceResponseDto>;
    findAll(): Promise<AbsenceResponseDto[]>;
    findOne(id: string): Promise<AbsenceResponseDto>;
    update(id: string, updateAbsenceDto: UpdateAbsenceDto): Promise<AbsenceResponseDto>;
    updateStatus(id: string, updateAbsenceStatusDto: UpdateAbsenceStatusDto): Promise<AbsenceResponseDto>;
    remove(id: string): Promise<void>;
}
export {};
