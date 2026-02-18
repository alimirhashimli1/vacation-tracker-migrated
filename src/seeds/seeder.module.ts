import { Module } from '@nestjs/common';
import { HolidaysModule } from '../holidays/holidays.module';
import { UsersModule } from '../users/users.module';
import { HolidaySeeder } from './holiday.seeder';
import { SuperAdminSeeder } from './superadmin.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';
import authConfig from '../config/auth.config';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // <--- ADD THIS IMPORT
import { AuthService } from '../auth/auth.service'; // <--- ADD THIS IMPORT

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
