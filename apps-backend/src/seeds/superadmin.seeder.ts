import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../shared/role.enum';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    this.logger.log('Seeding SuperAdmin user...');

    const superAdminEmail = (this.configService.get<string>('SUPERADMIN_EMAIL') || 'admin@example.com').toLowerCase();
    const superAdminPassword = this.configService.get<string>('SUPERADMIN_PASSWORD') || 'change-me-immediately';
    
    const existingUser = await this.userRepository.findOneBy({ email: superAdminEmail });

    if (existingUser) {
      this.logger.log(`SuperAdmin user ${superAdminEmail} already exists. Ensuring correct role and password.`);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);
      
      await this.userRepository.update(existingUser.id, { 
        role: Role.SuperAdmin,
        password: hashedPassword,
        isActive: true,
        emailVerified: true
      });
    } else {
      this.logger.log(`Creating new SuperAdmin user with email: ${superAdminEmail}`);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);

      const superAdminUser = this.userRepository.create({
        id: '00000000-0000-0000-0000-000000000001',
        firstName: 'System',
        lastName: 'Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: Role.SuperAdmin,
        isActive: true,
        emailVerified: true,
      });
      
      await this.userRepository.save(superAdminUser);
    }
  }
}
