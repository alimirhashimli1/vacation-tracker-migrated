import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateAbsenceDto,
  AbsenceResponseDto,
} from '../../../../shared/create-absence.dto';
import { UpdateAbsenceDto } from '../../../../shared/update-absence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absence } from './vacation.entity'; // This will be Absence entity
import { v4 as uuidv4 } from 'uuid';
import { AbsenceType } from '../../../../shared/absence-type.enum';
import { AbsenceStatus } from '../../../../shared/absence-status.enum';
import { differenceInDays } from 'date-fns';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private absenceRepository: Repository<Absence>,
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
}