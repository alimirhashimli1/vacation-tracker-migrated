import { AbsenceService } from './absence.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
export declare class AbsenceBalanceService {
    private readonly absenceService;
    private readonly dateUtils;
    private readonly usersService;
    constructor(absenceService: AbsenceService, dateUtils: DateUtils, usersService: UsersService);
    getYearlyAllowance(userId: string, year: number): Promise<number>;
    getUsedVacationDays(userId: string, year: number): Promise<number>;
    getRemainingVacationDays(userId: string, year: number): Promise<number>;
}
