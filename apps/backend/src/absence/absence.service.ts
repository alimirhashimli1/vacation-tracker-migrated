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

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
    private readonly absenceBalanceService: AbsenceBalanceService,
  ) {}

  private calculateRequestedDays(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end day
  }

  async create(dto: CreateAbsenceDto): Promise<AbsenceResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const requestedDays = this.calculateRequestedDays(startDate, endDate);

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
    const absence = await this.absenceRepository.findOneBy({ id });
    if (!absence) {
      throw new NotFoundException(`Absence with id ${id} not found`);
    }

    Object.assign(absence, updateDto);

    // Recalculate requestedDays if dates change
    if (updateDto.startDate || updateDto.endDate) {
      const newStartDate = updateDto.startDate ? new Date(updateDto.startDate) : absence.startDate;
      const newEndDate = updateDto.endDate ? new Date(updateDto.endDate) : absence.endDate;
      if (newStartDate > newEndDate) {
        throw new BadRequestException('Start date cannot be after end date.');
      }
      absence.requestedDays = this.calculateRequestedDays(newStartDate, newEndDate);
    }

    // Validation for VACATION type absences
    if (absence.type === AbsenceType.VACATION || updateDto.type === AbsenceType.VACATION) {
      const targetUserId = absence.userId;
      const targetYear = (updateDto.startDate ? new Date(updateDto.startDate) : absence.startDate).getFullYear();

      const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(targetUserId, targetYear);
      let usedDaysForYearExcludingCurrentAbsence = await this.absenceBalanceService.getUsedVacationDays(targetUserId, targetYear);

      // If the absence being updated was already an approved VACATION,
      // its original approvedDays need to be excluded from the `usedDaysForYear` calculation
      // to correctly determine the available balance for the *new* requestedDays.
      if (absence.type === AbsenceType.VACATION && absence.status === AbsenceStatus.APPROVED) {
          usedDaysForYearExcludingCurrentAbsence -= absence.approvedDays;
      }
      
      const availableDays = yearlyAllowance - usedDaysForYearExcludingCurrentAbsence;

      // The 'absence.requestedDays' already contains the potentially updated value after Object.assign(absence, updateDto)
      const potentialRequestedDays = absence.requestedDays; 

      if (potentialRequestedDays > availableDays) {
        throw new BadRequestException(
          `Requested vacation days (${potentialRequestedDays}) exceed remaining balance (${availableDays}).`,
        );
      }
    }

    // Calculate approvedDays only on approval
    if (updateDto.status === AbsenceStatus.APPROVED && absence.status !== AbsenceStatus.APPROVED) {
      absence.approvedDays = absence.requestedDays;
    } else if (updateDto.status !== AbsenceStatus.APPROVED && absence.status === AbsenceStatus.APPROVED) {
        // If status changes from approved to something else, reset approvedDays
        absence.approvedDays = 0;
    } else if (absence.status === AbsenceStatus.APPROVED && updateDto.status === AbsenceStatus.APPROVED){
        // If it's already approved and status is still approved, ensure approvedDays equals requestedDays
        absence.approvedDays = absence.requestedDays;
    }


    const updatedAbsence = await this.absenceRepository.save(absence);
    return this.mapToResponseDto(updatedAbsence);
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