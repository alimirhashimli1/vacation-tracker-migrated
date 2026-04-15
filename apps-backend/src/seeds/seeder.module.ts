import { Module } from '@nestjs/common';
import { DatabaseSeedingModule } from './database-seeding.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';
import authConfig from '../config/auth.config';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/user.entity';

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
    TypeOrmModule.forFeature([User]), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DatabaseSeedingModule,
  ],
  providers: [
    {
      provide: AuthService,
      useFactory: () => ({
        hashPassword: async (password: string): Promise<string> => {
          const saltRounds = 10;
          return bcrypt.hash(password, saltRounds);
        },
      }),
    },
  ],
  exports: [DatabaseSeedingModule],
})
export class SeederModule {}
