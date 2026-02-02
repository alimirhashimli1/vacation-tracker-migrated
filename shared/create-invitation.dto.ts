import { IsEmail, IsEnum } from 'class-validator';
import { Role } from './role.enum';

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;
}
