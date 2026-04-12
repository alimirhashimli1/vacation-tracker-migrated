import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidaySeeder } from './holiday.seeder';
import { SuperAdminSeeder } from './superadmin.seeder';
import { SeedingService } from './seeding.service';
import { User } from '../users/user.entity';
import { HolidaysModule } from '../holidays/holidays.module';
import { UsersModule } from '../users/users.module';
import { AbsenceModule } from '../absence/absence.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HolidaysModule,
    UsersModule,
    AbsenceModule,
    ConfigModule,
  ],
  providers: [
    HolidaySeeder,
    SuperAdminSeeder,
    SeedingService,
  ],
  exports: [SeedingService, HolidaySeeder, SuperAdminSeeder],
})
export class DatabaseSeedingModule {}
