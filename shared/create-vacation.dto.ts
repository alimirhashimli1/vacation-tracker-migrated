// src/vacation/dtos/create-vacation.dto.ts
import { IsString, IsDateString, IsEnum } from 'class-validator';

export enum VacationType {
  VACATION = 'VACATION',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  OTHER = 'OTHER',
}

export class CreateVacationDto {
  @IsString()
  userId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(VacationType)
  type!: VacationType;
}

// Response DTO
export class VacationResponseDto {
  id!: string;
  userId!: string;
  startDate!: string;
  endDate!: string;
  type!: VacationType;
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
}
