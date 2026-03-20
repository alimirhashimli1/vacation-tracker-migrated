import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async calculateRequestedDays(startDate: Date, endDate: Date, userId: string, isHalfDay: boolean = false): Promise<number> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
        throw new NotFoundException(`User with id ${userId} not found when calculating requested days.`);
    }
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

      const requestedDays = await this.calculateRequestedDays(startDate, endDate, dto.userId, dto.isHalfDay);

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
        const year = startDate.getFullYear();
        const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(dto.userId, year);
        const usedDaysBeforeThisRequest = await this.absenceBalanceService.getUsedVacationDays(dto.userId, year, queryRunner.manager);
        const availableDays = yearlyAllowance - usedDaysBeforeThisRequest;

        if (requestedDays > availableDays) {
          throw new BadRequestException('Vacation balance exceeded.');
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
    const absences = await this.absenceRepository.find();
    return absences.map(absence => this.mapToResponseDto(absence));
  }

  async findByUserId(userId: string): Promise<AbsenceResponseDto[]> {
    const absences = await this.absenceRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
    });
    return absences.map(absence => this.mapToResponseDto(absence));
  }

  async findOne(id: string): Promise<AbsenceResponseDto> {
    const absence = await this.absenceRepository.findOneBy({ id });
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
        (originalAbsenceStatus === AbsenceStatus.APPROVED || originalAbsenceStatus === AbsenceStatus.REJECTED) &&
        updateDto.status && updateDto.status !== originalAbsenceStatus
      ) {
        throw new BadRequestException(`Cannot change the status of an already ${originalAbsenceStatus} absence.`);
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

      absence.requestedDays = await this.calculateRequestedDays(updatedStartDate, updatedEndDate, absence.userId, absence.isHalfDay);

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

      if (absence.type === AbsenceType.VACATION || updateDto.type === AbsenceType.VACATION || originalAbsenceType === AbsenceType.VACATION) {
        const targetYear = updatedStartDate.getFullYear();
        const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(absence.userId, targetYear);
        let usedDays = await this.absenceBalanceService.getUsedVacationDays(absence.userId, targetYear, queryRunner.manager);

        if (originalAbsenceType === AbsenceType.VACATION && originalAbsenceStatus === AbsenceStatus.APPROVED) {
            usedDays -= originalApprovedDays;
        }
        
        const availableDays = yearlyAllowance - usedDays;

        if (absence.type === AbsenceType.VACATION && absence.status === AbsenceStatus.APPROVED) {
          if (absence.approvedDays > availableDays) {
            throw new BadRequestException('Vacation balance exceeded.');
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
    const result = await this.absenceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Absence with id ${id} not found`);
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
