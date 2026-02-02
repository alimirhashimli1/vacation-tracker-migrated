import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './user.dto';
import { Role } from './role.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    role?: Role;
    password?: string;
}
