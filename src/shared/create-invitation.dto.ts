import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from './role.enum';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
