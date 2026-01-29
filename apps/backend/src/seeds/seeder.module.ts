import { Module } from '@nestjs/common';
import { HolidaysModule } from '../holidays/holidays.module';
import { UsersModule } from '../users/users.module';
import { HolidaySeeder } from './holiday.seeder';
import { SuperAdminSeeder } from './superadmin.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';
import authConfig from '../config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    HolidaysModule,
    UsersModule,
  ],
  providers: [HolidaySeeder, SuperAdminSeeder],
  exports: [HolidaySeeder, SuperAdminSeeder],
})
export class SeederModule {}
