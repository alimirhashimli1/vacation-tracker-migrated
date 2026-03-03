import { CreateAbsenceDto, AbsenceResponseDto } from '../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../shared/update-absence.dto';
import { Repository } from 'typeorm';
import { Absence } from './absence.entity';
import { AbsenceBalanceService } from './absence-balance.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
export declare class AbsenceService {
    private absenceRepository;
    private readonly absenceBalanceService;
    private readonly dateUtils;
    private readonly usersService;
    private readonly dataSource;
    constructor(absenceRepository: Repository<Absence>, absenceBalanceService: AbsenceBalanceService, dateUtils: DateUtils, usersService: UsersService, dataSource: DataSource);
    private calculateRequestedDays;
    create(dto: CreateAbsenceDto): Promise<AbsenceResponseDto>;
    findAll(): Promise<AbsenceResponseDto[]>;
    findOne(id: string): Promise<AbsenceResponseDto>;
    update(id: string, updateDto: UpdateAbsenceDto): Promise<AbsenceResponseDto>;
    remove(id: string): Promise<void>;
    private mapToResponseDto;
    getApprovedVacationsForYear(userId: string, year: number): Promise<Absence[]>;
}
