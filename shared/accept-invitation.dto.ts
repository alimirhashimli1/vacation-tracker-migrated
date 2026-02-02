import { IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsUUID('4') // Assuming UUID v4 for the token
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
