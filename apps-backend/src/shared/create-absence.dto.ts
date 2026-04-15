import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { AbsenceType } from './absence-type.enum';
import { AbsenceStatus } from './absence-status.enum';
import { UserResponseDto } from './user.dto';

export class CreateAbsenceDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(AbsenceType)
  @IsNotEmpty()
  type: AbsenceType;

  @IsOptional()
  isHalfDay?: boolean;

  @IsNumber()
  @IsNotEmpty()
  totalHours: number;

  @IsNumber()
  @IsNotEmpty()
  cost: number;
}

export class AbsenceResponseDto {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  status: AbsenceStatus;
  isHalfDay: boolean;
  requestedDays: number;
  approvedDays: number;
  totalHours: number;
  cost: number;
  user?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
