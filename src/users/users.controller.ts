import { Controller, Post, Body, UseGuards, Get, Patch, Param, NotFoundException, ForbiddenException, Req, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../shared/user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../shared/auth/roles.guard';
import { Roles } from '../shared/auth/roles.decorator';
import { Role } from '../shared/role.enum';
import { UpdateUserDto } from '../shared/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  async create(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (!req.user.roles.includes(Role.Admin) && !req.user.roles.includes(Role.SuperAdmin) && req.user.id !== user.id) {
      throw new ForbiddenException('You do not have permission to view this profile.');
    }

    return user;
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any): Promise<Omit<User, 'password'> | null> {
    const targetUser = await this.usersService.findOneById(id);

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const currentUserRoles: Role[] = req.user.roles;
    if (currentUserRoles.includes(Role.Admin) && !currentUserRoles.includes(Role.SuperAdmin) && targetUser.role === Role.SuperAdmin) {
      throw new ForbiddenException('Admins cannot modify SuperAdmin users.');
    }
    
    if (!req.user.roles.includes(Role.Admin) && !req.user.roles.includes(Role.SuperAdmin) && req.user.id !== id) {
      throw new ForbiddenException('You do not have permission to update this profile.');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
