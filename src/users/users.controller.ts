import { Controller, Post, Body, UseGuards, Get, Patch, Param, NotFoundException, ForbiddenException, Req, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../shared/user.dto';
import { User } from './user.entity';
import { RolesGuard } from '../shared/auth/roles.guard';
import { Roles } from '../shared/auth/roles.decorator';
import { Role } from '../shared/role.enum';
import { UpdateUserDto } from '../shared/update-user.dto';

@UseGuards(RolesGuard)
@Roles(Role.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.usersService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any): Promise<Omit<User, 'password'> | null> {
    const targetUser = await this.usersService.findOneById(id);

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const currentUserRoles: Role[] = req.user.roles;
    if (currentUserRoles.includes(Role.Admin) && targetUser.role === Role.SuperAdmin) {
      throw new ForbiddenException('Admins cannot modify SuperAdmin users.');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}

