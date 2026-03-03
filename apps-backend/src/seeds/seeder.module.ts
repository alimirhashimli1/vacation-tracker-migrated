import { Module } from '@nestjs/common';
import { AbsenceModule } from '../absence/absence.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { UsersModule } from '../users/users.module';
import { HolidaySeeder } from './holiday.seeder';
import { SuperAdminSeeder } from './superadmin.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';
import authConfig from '../config/auth.config';
import mailerConfig from '../config/mailer.config'; // Import mailer config
import { MailerModule } from '@nestjs-modules/mailer'; // Import MailerModule
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // <--- ADD THIS IMPORT
import { AuthService } from '../auth/auth.service'; // <--- ADD THIS IMPORT
import { User } from '../users/user.entity'; // Import User entity

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, mailerConfig], // Add mailerConfig
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    // Explicitly make UserRepository available for SeederModule
    TypeOrmModule.forFeature([User]), 
    MailerModule.forRootAsync({ // Add MailerModule async config
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('mailer'),
      }),
    }),
    JwtModule.registerAsync({ // <--- ADD THIS BLOCK
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    HolidaysModule,
    UsersModule,
    AuthModule,
    AbsenceModule, // <-- ADD THIS
  ],
  providers: [
    HolidaySeeder,
    SuperAdminSeeder,
    // Custom provider for AuthService to bypass JwtService dependency during seeding
    {
      provide: AuthService,
      useFactory: () => ({
        // Only implement hashPassword as it's the only method needed by UsersService for seeding
        hashPassword: async (password: string): Promise<string> => {
          const saltRounds = 10;
          return bcrypt.hash(password, saltRounds);
        },
        // Mock other methods if they were strictly necessary, but for seeding, hashPassword is enough.
        // For instance: login: () => {}, validateUser: () => {}
      }),
    },
  ],
  exports: [HolidaySeeder, SuperAdminSeeder],
})
export class SeederModule {}
