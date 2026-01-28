import { IsDateString, IsEnum, IsUUID, IsOptional, IsNumber } from 'class-validator';
import { AbsenceType } from './absence-type.enum';
import { AbsenceStatus } from './absence-status.enum';

export class CreateAbsenceDto {
  @IsUUID()
  userId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(AbsenceType)
  type!: AbsenceType;
}

export class AbsenceResponseDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  userId!: string;

  @IsDateString()
  startDate!: Date;

  @IsDateString()
  endDate!: Date;

  @IsEnum(AbsenceType)
  type!: AbsenceType;

  @IsEnum(AbsenceStatus)
  status!: AbsenceStatus;

  @IsNumber()
  requestedDays!: number;

  @IsNumber()
  approvedDays!: number;

  createdAt!: Date;
  updatedAt!: Date;
}
