import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AbsenceBalance } from './absence-balance.entity';

@Injectable()
export class AbsenceBalanceService {
  constructor(
    @InjectRepository(AbsenceBalance)
    private readonly balanceRepository: Repository<AbsenceBalance>,
    @Inject(forwardRef(() => AbsenceService))
    private readonly absenceService: AbsenceService,
    private readonly dateUtils: DateUtils,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Rolling Balance: Get the persistent remaining balance.
   */
  async getRemainingVacationDays(userId: string, year: number, manager?: EntityManager): Promise<number> {
    const balance = await this.getOrCreateBalance(userId, manager);
    return Number(balance.remainingDays);
  }

  /**
   * Yearly Reset: newBalance = currentRemaining + 30.
   * No capping logic is applied.
   */
  async resetYearly(userId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(AbsenceBalance) : this.balanceRepository;
    const balance = await this.getOrCreateBalance(userId, manager);
    
    balance.remainingDays = Number(balance.remainingDays) + 30;
    await repo.save(balance);
  }

  /**
   * Approved vacations subtract from the persistent balance.
   */
  async deductFromBalance(userId: string, days: number, manager: EntityManager): Promise<void> {
    const balance = await this.getOrCreateBalance(userId, manager);
    balance.remainingDays = Number(balance.remainingDays) - days;
    await manager.save(AbsenceBalance, balance);
  }

  /**
   * If an approved vacation is cancelled or rejected later, we add the days back.
   */
  async refundToBalance(userId: string, days: number, manager: EntityManager): Promise<void> {
    const balance = await this.getOrCreateBalance(userId, manager);
    balance.remainingDays = Number(balance.remainingDays) + days;
    await manager.save(AbsenceBalance, balance);
  }

  private async getOrCreateBalance(userId: string, manager?: EntityManager): Promise<AbsenceBalance> {
    const repo = manager ? manager.getRepository(AbsenceBalance) : this.balanceRepository;
    let balance = await repo.findOne({ where: { userId } });
    
    if (!balance) {
      balance = repo.create({ userId, remainingDays: 30 });
      balance = await repo.save(balance);
    }
    
    return balance;
  }

  // Deprecated methods for compatibility or cleanup
  async getYearlyAllowance(userId: string, year: number): Promise<number> {
    // Allowance is now the sum of accumulated balance
    return this.getRemainingVacationDays(userId, year);
  }

  async getUsedVacationDays(userId: string, year: number, manager?: EntityManager): Promise<number> {
    // In a rolling system, we don't necessarily track "used this year" against a fixed allowance,
    // but we can still calculate it for reporting.
    const absences = await this.absenceService.getApprovedVacationsForYear(userId, year, manager);
    return absences.reduce((total, absence) => total + Number(absence.approvedDays), 0);
  }
}
