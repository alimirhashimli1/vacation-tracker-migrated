import { PartialType } from '@nestjs/mapped-types';
import { CreateAbsenceDto } from './create-absence.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { AbsenceStatus } from './absence-status.enum';
import { AbsenceType } from './absence-type.enum';

export class UpdateAbsenceDto extends PartialType(CreateAbsenceDto) {
  @IsOptional()
  @IsEnum(AbsenceStatus)
  status?: AbsenceStatus;

  @IsOptional()
  @IsEnum(AbsenceType)
  type?: AbsenceType;

  @IsOptional()
  @IsNumber()
  totalHours?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  approvedDays?: number;
}
