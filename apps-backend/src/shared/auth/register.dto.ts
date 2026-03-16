import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AcceptInvitationDto } from '../accept-invitation.dto'; // Adjust path if necessary

export class RegisterDto extends AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;
}
