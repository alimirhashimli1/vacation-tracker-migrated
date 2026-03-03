import { Role } from './role.enum';
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: Role;
    isActive?: boolean;
    emailVerified?: boolean;
    countryCode?: string;
}
export declare class UserResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    isActive: boolean;
    isVerified: boolean;
    countryCode: string;
    createdAt: Date;
    updatedAt: Date;
}
