import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateAbsenceDto,
  AbsenceResponseDto,
} from '../../../../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../../../../shared/update-absence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Absence } from './absence.entity'; // This will be Absence entity
import { v4 as uuidv4 } from 'uuid';
import { AbsenceType } from '../../../../shared/absence-type.enum';
import { AbsenceStatus } from '../../../../shared/absence-status.enum';
import { differenceInDays } from 'date-fns';
import { AbsenceBalanceService } from './absence-balance.service';
import { DateUtils } from '../utils/date.utils'; // Import DateUtils
import { UsersService } from '../users/users.service'; // Import UsersService
import { DataSource } from 'typeorm'; // Import DataSource

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    private readonly absenceBalanceService: AbsenceBalanceService,
    private readonly dateUtils: DateUtils, // Inject DateUtils
    private readonly usersService: UsersService, // Inject UsersService
    private readonly dataSource: DataSource, // Inject DataSource
  ) {}

  private async calculateRequestedDays(startDate: Date, endDate: Date, userId: string): Promise<number> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
        throw new NotFoundException(`User with id ${userId} not found when calculating requested days.`);
    }
    return this.dateUtils.getWorkingDaysBetween(startDate, endDate, user.region);
  }

  async create(dto: CreateAbsenceDto): Promise<AbsenceResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const requestedDays = await this.calculateRequestedDays(startDate, endDate, dto.userId);

    if (requestedDays === 0) {
      throw new BadRequestException('Absence request cannot be for only weekends or public holidays.');
    }

    // Overlap validation
    const allApprovedAbsences = await this.absenceRepository.find({
        where: {
            userId: dto.userId,
            status: AbsenceStatus.APPROVED,
        },
    });

    const isOverlapping = allApprovedAbsences.some(existingAbsence => {
        const newStart = new Date(dto.startDate);
        const newEnd = new Date(dto.endDate);
        const existingStart = existingAbsence.startDate;
        const existingEnd = existingAbsence.endDate;

        // Overlap if:
        // The new period starts within or before the existing period, and ends within or after the existing period.
        return (newStart <= existingEnd && newEnd >= existingStart);
    });

    if (isOverlapping) {
      throw new BadRequestException('Absence request overlaps with an existing approved absence.');
    }

    if (dto.type === AbsenceType.VACATION) {
      const year = startDate.getFullYear();
      const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(dto.userId, year);
      const usedDaysBeforeThisRequest = await this.absenceBalanceService.getUsedVacationDays(dto.userId, year);
      const availableDays = yearlyAllowance - usedDaysBeforeThisRequest;

      if (requestedDays > availableDays) {
        throw new BadRequestException(
          `Requested vacation days (${requestedDays}) exceed remaining balance (${availableDays}).`,
        );
      }
    }

    const newAbsence = this.absenceRepository.create({
      id: uuidv4(),
      userId: dto.userId,
      startDate: startDate,
      endDate: endDate,
      type: dto.type,
      status: AbsenceStatus.PENDING,
      requestedDays: requestedDays,
      approvedDays: 0, // Initially 0
    });
    const savedAbsence = await this.absenceRepository.save(newAbsence);
    return this.mapToResponseDto(savedAbsence);
  }

  async findAll(): Promise<AbsenceResponseDto[]> {
    const absences = await this.absenceRepository.find();
    return absences.map(this.mapToResponseDto);
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

      const originalAbsenceStatus = absence.status;
      const originalApprovedDays = absence.approvedDays;
      const originalAbsenceType = absence.type;

      // Check if the absence is already in a terminal state (APPROVED or REJECTED)
      // and prevent further status changes.
      if (
        (originalAbsenceStatus === AbsenceStatus.APPROVED || originalAbsenceStatus === AbsenceStatus.REJECTED) &&
        updateDto.status && updateDto.status !== originalAbsenceStatus
      ) {
        throw new BadRequestException(`Cannot change the status of an already ${originalAbsenceStatus} absence.`);
      }

      Object.assign(absence, updateDto);

      const updatedStartDate = updateDto.startDate ? new Date(updateDto.startDate) : absence.startDate;
      const updatedEndDate = updateDto.endDate ? new Date(updateDto.endDate) : absence.endDate;

      if (updatedStartDate > updatedEndDate) {
        throw new BadRequestException('Start date cannot be after end date.');
      }

      absence.requestedDays = await this.calculateRequestedDays(updatedStartDate, updatedEndDate, absence.userId);

      if (absence.requestedDays === 0) {
        throw new BadRequestException('Absence request cannot be for only weekends or public holidays.');
      }

      // Overlap validation for update
      const allApprovedAbsences = await queryRunner.manager.find(Absence, {
          where: {
              userId: absence.userId,
              status: AbsenceStatus.APPROVED,
          },
      });

      const isOverlapping = allApprovedAbsences.some(existingAbsence => {
          // Exclude the current absence being updated from overlap check
          if (existingAbsence.id === id) {
              return false;
          }

          const newStart = updatedStartDate;
          const newEnd = updatedEndDate;
          const existingStart = existingAbsence.startDate;
          const existingEnd = existingAbsence.endDate;

          return (newStart <= existingEnd && newEnd >= existingStart);
      });

      if (isOverlapping) {
        throw new BadRequestException('Absence request overlaps with an existing approved absence.');
      }

      // Calculate approvedDays based on potential status change and requestedDays
      // This logic must run BEFORE the vacation balance check
      if (absence.status === AbsenceStatus.APPROVED && originalAbsenceStatus !== AbsenceStatus.APPROVED) {
        absence.approvedDays = absence.requestedDays;
      } else if (absence.status !== AbsenceStatus.APPROVED && originalAbsenceStatus === AbsenceStatus.APPROVED) {
          absence.approvedDays = 0;
      } else if (absence.status === AbsenceStatus.APPROVED && originalAbsenceStatus === AbsenceStatus.APPROVED){
          absence.approvedDays = absence.requestedDays;
      } else if (absence.status === AbsenceStatus.PENDING || absence.status === AbsenceStatus.REJECTED) {
          absence.approvedDays = 0;
      }


      // Validation for VACATION type absences
      if (absence.type === AbsenceType.VACATION || updateDto.type === AbsenceType.VACATION || originalAbsenceType === AbsenceType.VACATION) {
        const targetUserId = absence.userId;
        const targetYear = updatedStartDate.getFullYear();

        const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(targetUserId, targetYear);
        let usedDaysForYearExcludingCurrentAbsence = await this.absenceBalanceService.getUsedVacationDays(targetUserId, targetYear);

        // If the absence being updated was an approved VACATION *before* this update,
        // its original approvedDays need to be excluded from the `usedDaysForYear` calculation
        // to correctly determine the available balance for the *new* requestedDays and status.
        // This step is crucial if the new status is APPROVED and its type is VACATION.
        if (originalAbsenceType === AbsenceType.VACATION && originalAbsenceStatus === AbsenceStatus.APPROVED) {
            usedDaysForYearExcludingCurrentAbsence -= originalApprovedDays;
        }
        
        const availableDays = yearlyAllowance - usedDaysForYearExcludingCurrentAbsence;

        // Now, if the current (post-updateDto) absence is a VACATION type and APPROVED,
        // check if its requestedDays (which became approvedDays) would exceed the available balance.
        if (absence.type === AbsenceType.VACATION && absence.status === AbsenceStatus.APPROVED) {
          if (absence.approvedDays > availableDays) {
            throw new BadRequestException(
              `Approving this vacation request (${absence.approvedDays}) exceeds remaining balance (${availableDays}).`,
            );
          }
        } else if (absence.type === AbsenceType.VACATION) { // If it's a VACATION type but not approved (PENDING/REJECTED),
                                                          // still ensure requestedDays don't exceed future approval limits.
                                                          // Let's refine this to only check balance when approving.
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
      startDate: absence.startDate,
      endDate: absence.endDate,
      type: absence.type,
      status: absence.status,
      requestedDays: absence.requestedDays,
      approvedDays: absence.approvedDays,
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt,
    };
  }

  async getApprovedVacationsForYear(userId: string, year: number): Promise<Absence[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.absenceRepository.find({
      where: {
        userId,
        status: AbsenceStatus.APPROVED,
        type: AbsenceType.VACATION,
        startDate: Between(startDate, endDate),
      },
    });
  }
}