import { IsEnum, IsNotEmpty } from 'class-validator';
import { AbsenceStatus } from './absence-status.enum';

export class UpdateAbsenceStatusDto {
  @IsEnum(AbsenceStatus)
  @IsNotEmpty()
  status: AbsenceStatus;
}
