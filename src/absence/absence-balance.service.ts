import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';

@Injectable()
export class AbsenceBalanceService {
  constructor(
    @Inject(forwardRef(() => AbsenceService))
    private readonly absenceService: AbsenceService,
    private readonly dateUtils: DateUtils,
    private readonly usersService: UsersService,
  ) {}

  async getYearlyAllowance(userId: string, year: number): Promise<number> {
    // This could be based on user's contract, role, etc. For now, it's fixed.
    return 30;
  }

  async getUsedVacationDays(userId: string, year: number): Promise<number> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const absences = await this.absenceService.getApprovedVacationsForYear(userId, year);
    
    return absences.reduce((total, absence) => total + absence.approvedDays, 0);
  }

  async getRemainingVacationDays(userId: string, year: number): Promise<number> {
    const allowance = await this.getYearlyAllowance(userId, year);
    const usedDays = await this.getUsedVacationDays(userId, year);
    return allowance - usedDays;
  }
}
