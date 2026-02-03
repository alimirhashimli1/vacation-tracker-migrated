import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Role } from '../../../../shared/role.enum';
import { CreateUserDto } from '../../../../shared/user.dto';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(private readonly usersService: UsersService) {}

  async seed() {
    this.logger.log('Seeding SuperAdmin user...');

    const superAdminEmail = 'admin@system.local';
    const superAdminPassword = 'superadminpassword'; // TODO: Use a more secure way to get this in production

    let superAdminUser = await this.usersService.findOneByEmail(superAdminEmail);

    if (superAdminUser) {
      this.logger.log('SuperAdmin user already exists.');
      if (superAdminUser.role !== Role.SuperAdmin) {
        this.logger.log('Updating existing SuperAdmin user role.');
        await this.usersService.update(superAdminUser.id, { role: Role.SuperAdmin });
      }
    } else {
      this.logger.log('Creating new SuperAdmin user.');
      const createSuperAdminDto: CreateUserDto = {
        firstName: 'System',
        lastName: 'Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        role: Role.SuperAdmin,
      };
      await this.usersService.create(createSuperAdminDto);
    }
  }
}
