import { IsString, IsEmail, IsEnum, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { Role } from './role.enum';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsEnum(Role)
  @IsOptional() // Role can be optional if a default is set in the entity or service
  role?: Role;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Password update might be handled by a separate DTO or endpoint for security reasons,
  // but including it here as optional for completeness based on typical update scenarios.
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: Role;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
