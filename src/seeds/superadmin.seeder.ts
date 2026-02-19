import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../shared/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed() {
    this.logger.log('Seeding SuperAdmin user...');

    const superAdminEmail = 'alimirhashimli@gmail.com';
    const superAdminPassword = '1Kaybettim.';
    
    const existingUser = await this.userRepository.findOneBy({ email: superAdminEmail });

    if (existingUser) {
      this.logger.log('SuperAdmin user already exists.');
      if (existingUser.role !== Role.SuperAdmin) {
        this.logger.log('Updating existing user to be SuperAdmin.');
        await this.userRepository.update(existingUser.id, { role: Role.SuperAdmin });
      }
    } else {
      this.logger.log('Creating new SuperAdmin user.');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);

      const superAdminUser = this.userRepository.create({
        firstName: 'System',
        lastName: 'Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: Role.SuperAdmin,
        isActive: true,
        emailVerified: true, // SuperAdmin should be verified by default
      });
      
      await this.userRepository.save(superAdminUser);
    }
  }
}
