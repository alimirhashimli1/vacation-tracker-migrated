import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateVacationDto,
  VacationResponseDto,
} from '../../../../shared/create-vacation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vacation } from './vacation.entity';
import { v4 as uuidv4 } from 'uuid';
import { VacationType } from '../../../../shared/create-vacation.dto';


@Injectable()
export class VacationService {
  constructor(
    @InjectRepository(Vacation)
    private vacationRepository: Repository<Vacation>,
  ) {}

  async create(dto: CreateVacationDto): Promise<VacationResponseDto> {
    const newVacation = this.vacationRepository.create({
      id: uuidv4(),
      userId: dto.userId, // Changed from employeeId to userId
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      type: dto.type,
      status: 'PENDING',
    });
    const savedVacation = await this.vacationRepository.save(newVacation);
    return this.mapToResponseDto(savedVacation);
  }

  async findAll(): Promise<VacationResponseDto[]> {
    const vacations = await this.vacationRepository.find();
    return vacations.map(this.mapToResponseDto);
  }

  async findOne(id: string): Promise<VacationResponseDto> {
    const vacation = await this.vacationRepository.findOneBy({ id });
    if (!vacation) {
      throw new NotFoundException(`Vacation with id ${id} not found`);
    }
    return this.mapToResponseDto(vacation);
  }

  async updateStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
  ): Promise<VacationResponseDto> {
    const vacation = await this.vacationRepository.findOneBy({ id });
    if (!vacation) {
      throw new NotFoundException(`Vacation with id ${id} not found`);
    }
    vacation.status = status;
    const updatedVacation = await this.vacationRepository.save(vacation);
    return this.mapToResponseDto(updatedVacation);
  }

  async remove(id: string): Promise<void> {
    const result = await this.vacationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vacation with id ${id} not found`);
    }
  }

  private mapToResponseDto(vacation: Vacation): VacationResponseDto {
    return {
      id: vacation.id,
      userId: vacation.userId, // Changed from employeeId to userId
      startDate: vacation.startDate.toISOString().split('T')[0], // Return as YYYY-MM-DD
      endDate: vacation.endDate.toISOString().split('T')[0], // Return as YYYY-MM-DD
      type: vacation.type,
      status: vacation.status,
    };
  }
}
