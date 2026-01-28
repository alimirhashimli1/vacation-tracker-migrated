import { IsEnum } from 'class-validator';
import { AbsenceStatus } from './absence-status.enum';

export class UpdateAbsenceStatusDto {
  @IsEnum(AbsenceStatus)
  status!: AbsenceStatus;
}
