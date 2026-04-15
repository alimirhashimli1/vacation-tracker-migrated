import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateAbsenceDto, AbsenceResponseDto, } from '../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../shared/update-absence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, In, DataSource, EntityManager } from 'typeorm';
import { Absence } from './absence.entity';
import { v4 as uuidv4 } from 'uuid';
import { AbsenceType } from '../shared/absence-type.enum';
import { AbsenceStatus } from '../shared/absence-status.enum';
import { AbsenceBalanceService } from './absence-balance.service';
import { DateUtils } from '../utils/date.utils';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    private readonly absenceBalanceService: AbsenceBalanceService,
    private readonly dateUtils: DateUtils,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  private async calculateRequestedDays(startDate: Date, endDate: Date, user: User, isHalfDay: boolean = false): Promise<number> {
    const workingDays = await this.dateUtils.getWorkingDaysBetween(startDate, endDate, user.region);
    return isHalfDay ? workingDays * 0.5 : workingDays;
  }

  async create(dto: CreateAbsenceDto): Promise<AbsenceResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      // Prevent past date requests
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new BadRequestException('Cannot request absence for a past date.');
      }

      if (startDate > endDate) {
        throw new BadRequestException('Start date cannot be after end date.');
      }

      // 1. Lock the user row to prevent race conditions on balance/overlap
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${dto.userId} not found.`);
      }

      if (dto.isHalfDay) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(endDate);
        e.setHours(0, 0, 0, 0);
        if (s.getTime() !== e.getTime()) {
          throw new BadRequestException('Half-day requests must be for a single day.');
        }
      }

      if (dto.type === AbsenceType.VACATION && startDate.getFullYear() !== endDate.getFullYear()) {
        throw new BadRequestException('Vacation requests cannot span multiple years.');
      }

      const requestedDays = await this.calculateRequestedDays(startDate, endDate, user, dto.isHalfDay);

      if (requestedDays === 0) {
        throw new BadRequestException('Public holidays or weekends cannot be requested.');
      }

      // 2. Overlap validation
      const existingAbsences = await queryRunner.manager.find(Absence, {
        where: {
          userId: dto.userId,
          status: In([AbsenceStatus.APPROVED, AbsenceStatus.PENDING]),
        },
      });

      const isOverlapping = existingAbsences.some(existingAbsence => {
        const newStart = startDate;
        const newEnd = endDate;
        const existingStart = existingAbsence.startDate;
        const existingEnd = existingAbsence.endDate;

        return (newStart <= existingEnd && newEnd >= existingStart);
      });

      if (isOverlapping) {
        throw new BadRequestException('Date overlaps with existing absence.');
      }

      // 3. Balance validation
      if (dto.type === AbsenceType.VACATION) {
        const availableDays = await this.absenceBalanceService.getRemainingVacationDays(dto.userId, startDate.getFullYear(), queryRunner.manager);

        if (requestedDays > availableDays) {
          throw new BadRequestException(`Vacation balance exceeded. Available: ${availableDays} days.`);
        }
      }

      const newAbsence = queryRunner.manager.create(Absence, {
        id: uuidv4(),
        userId: dto.userId,
        startDate: startDate,
        endDate: endDate,
        type: dto.type,
        status: AbsenceStatus.PENDING,
        isHalfDay: !!dto.isHalfDay,
        requestedDays: requestedDays,
        approvedDays: 0,
      });

      const savedAbsence = await queryRunner.manager.save(Absence, newAbsence);
      await queryRunner.commitTransaction();
      return this.mapToResponseDto(savedAbsence);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<AbsenceResponseDto[]> {
    const absences = await this.absenceRepository.find({
      relations: ['user'],
      order: { startDate: 'DESC' },
    });
    return absences.map(absence => this.mapToResponseDto(absence));
  }

  async findByUserId(userId: string): Promise<AbsenceResponseDto[]> {
    const absences = await this.absenceRepository.find({
      where: { userId },
      relations: ['user'],
      order: { startDate: 'DESC' },
    });
    return absences.map(absence => this.mapToResponseDto(absence));
  }

  async findOne(id: string): Promise<AbsenceResponseDto> {
    const absence = await this.absenceRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!absence) {
      throw new NotFoundException(`Absence with id ${id} not found`);
    }
    return this.mapToResponseDto(absence);
  }

  async update(id: string, updateDto: UpdateAbsenceDto): Promise<AbsenceResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const absence = await queryRunner.manager.findOneBy(Absence, { id });
      if (!absence) {
        throw new NotFoundException(`Absence with id ${id} not found`);
      }

      // 1. Lock the user row
      const user = await queryRunner.manager.findOne(User, {
        where: { id: absence.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${absence.userId} not found.`);
      }

      const originalAbsenceStatus = absence.status;
      const originalApprovedDays = Number(absence.approvedDays);
      const originalAbsenceType = absence.type;

      if (
        (originalAbsenceStatus === AbsenceStatus.APPROVED || 
         originalAbsenceStatus === AbsenceStatus.REJECTED || 
         originalAbsenceStatus === AbsenceStatus.CANCELLED) &&
        updateDto.status && updateDto.status !== originalAbsenceStatus
      ) {
        throw new BadRequestException(`Cannot change the status of an already ${originalAbsenceStatus} absence.`);
      }

      // Idempotency check: if already approved/rejected/cancelled and same status requested, return early
      if (updateDto.status && updateDto.status === originalAbsenceStatus && !updateDto.startDate && !updateDto.endDate && updateDto.approvedDays === undefined) {
        await queryRunner.commitTransaction();
        return this.mapToResponseDto(absence);
      }

      Object.assign(absence, updateDto);

      const updatedStartDate = this.dateUtils.parseDate(updateDto.startDate || absence.startDate);
      const updatedEndDate = this.dateUtils.parseDate(updateDto.endDate || absence.endDate);
      
      absence.startDate = updatedStartDate;
      absence.endDate = updatedEndDate;

      if (updatedStartDate > updatedEndDate) {
        throw new BadRequestException('Start date cannot be after end date.');
      }

      if (absence.type === AbsenceType.VACATION && updatedStartDate.getFullYear() !== updatedEndDate.getFullYear()) {
        throw new BadRequestException('Vacation requests cannot span multiple years.');
      }

      absence.requestedDays = await this.calculateRequestedDays(updatedStartDate, updatedEndDate, user, absence.isHalfDay);

      if (absence.requestedDays === 0) {
        throw new BadRequestException('Public holidays cannot be requested.');
      }

      const existingAbsences = await queryRunner.manager.find(Absence, {
        where: {
          userId: absence.userId,
          status: In([AbsenceStatus.APPROVED, AbsenceStatus.PENDING]),
        },
      });

      const isOverlapping = existingAbsences.some(existingAbsence => {
        if (existingAbsence.id === id) return false;
        const newStart = updatedStartDate;
        const newEnd = updatedEndDate;
        const existingStart = existingAbsence.startDate;
        const existingEnd = existingAbsence.endDate;
        return (newStart <= existingEnd && newEnd >= existingStart);
      });

      if (isOverlapping) {
        throw new BadRequestException('Date overlaps with existing absence.');
      }

      if (absence.status === AbsenceStatus.APPROVED) {
        if (updateDto.approvedDays !== undefined) {
          if (updateDto.approvedDays < 0) throw new BadRequestException('Approved days cannot be negative.');
          if (updateDto.approvedDays > absence.requestedDays) {
            throw new BadRequestException(`Approved days cannot exceed requested days.`);
          }
          absence.approvedDays = updateDto.approvedDays;
        } else {
          absence.approvedDays = absence.requestedDays;
        }
      } else {
        absence.approvedDays = 0;
      }

      // 4. Rolling Balance logic: Deduct or Refund persistent balance
      if (absence.type === AbsenceType.VACATION || originalAbsenceType === AbsenceType.VACATION) {
        const currentBalance = await this.absenceBalanceService.getRemainingVacationDays(absence.userId, updatedStartDate.getFullYear(), queryRunner.manager);
        
        let balanceAdjustment = 0;
        
        // If it was previously approved, refund the old days first
        if (originalAbsenceType === AbsenceType.VACATION && originalAbsenceStatus === AbsenceStatus.APPROVED) {
          balanceAdjustment += originalApprovedDays;
        }
        
        // If it's now approved, deduct the new days
        if (absence.type === AbsenceType.VACATION && absence.status === AbsenceStatus.APPROVED) {
          balanceAdjustment -= absence.approvedDays;
        }

        if (balanceAdjustment !== 0) {
          const finalExpectedBalance = currentBalance + balanceAdjustment;
          if (finalExpectedBalance < 0) {
            throw new BadRequestException(`Vacation balance exceeded. Available: ${currentBalance} days.`);
          }
          
          if (balanceAdjustment > 0) {
            await this.absenceBalanceService.refundToBalance(absence.userId, balanceAdjustment, queryRunner.manager);
          } else {
            await this.absenceBalanceService.deductFromBalance(absence.userId, Math.abs(balanceAdjustment), queryRunner.manager);
          }
        }
      }

      const updatedAbsence = await queryRunner.manager.save(Absence, absence);
      await queryRunner.commitTransaction();
      return this.mapToResponseDto(updatedAbsence);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const absence = await queryRunner.manager.findOne(Absence, { where: { id } });
      if (!absence) {
        throw new NotFoundException(`Absence with id ${id} not found`);
      }

      // Lock user row to ensure consistency if deleting an approved vacation
      await queryRunner.manager.findOne(User, {
        where: { id: absence.userId },
        lock: { mode: 'pessimistic_write' },
      });

      // Refund balance if it was an approved vacation
      if (absence.type === AbsenceType.VACATION && absence.status === AbsenceStatus.APPROVED) {
        await this.absenceBalanceService.refundToBalance(absence.userId, Number(absence.approvedDays), queryRunner.manager);
      }

      await queryRunner.manager.remove(Absence, absence);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: string, userId: string): Promise<AbsenceResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const absence = await queryRunner.manager.findOne(Absence, { where: { id } });
      if (!absence) {
        throw new NotFoundException(`Absence with id ${id} not found`);
      }

      if (absence.userId !== userId) {
        throw new ForbiddenException('You can only cancel your own absence requests.');
      }

      if (absence.status !== AbsenceStatus.PENDING) {
        throw new BadRequestException(`Cannot cancel an absence that is already ${absence.status}.`);
      }

      // Lock user row
      await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      absence.status = AbsenceStatus.CANCELLED;
      const updatedAbsence = await queryRunner.manager.save(Absence, absence);
      await queryRunner.commitTransaction();
      return this.mapToResponseDto(updatedAbsence);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(absence: Absence): AbsenceResponseDto {
    return {
      id: absence.id,
      userId: absence.userId,
      startDate: this.dateUtils.parseDate(absence.startDate).toISOString(),
      endDate: this.dateUtils.parseDate(absence.endDate).toISOString(),
      type: absence.type,
      status: absence.status,
      isHalfDay: absence.isHalfDay,
      requestedDays: Number(absence.requestedDays),
      approvedDays: Number(absence.approvedDays),
      totalHours: absence.totalHours,
      cost: Number(absence.cost),
      user: absence.user ? {
        id: absence.user.id,
        firstName: absence.user.firstName,
        lastName: absence.user.lastName,
        email: absence.user.email,
        role: absence.user.role,
        isActive: absence.user.isActive,
        emailVerified: absence.user.emailVerified,
        region: absence.user.region,
        createdAt: absence.user.createdAt,
        updatedAt: absence.user.updatedAt,
      } : undefined,
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt,
    };
  }

  async getApprovedVacationsForYear(userId: string, year: number, manager?: EntityManager): Promise<Absence[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const repo = manager ? manager.getRepository(Absence) : this.absenceRepository;

    return repo.find({
      where: {
        userId,
        status: AbsenceStatus.APPROVED,
        type: AbsenceType.VACATION,
        startDate: Between(startDate, endDate),
      },
    });
  }
}
