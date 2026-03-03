import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AbsenceModule } from './absence/absence.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module'; // Import UsersModule
import { AuthModule } from './auth/auth.module'; // Import AuthModule
import authConfig from './config/auth.config'; // Import authConfig
import { HolidaysModule } from './holidays/holidays.module';
import { DateUtilsModule } from './utils/date.utils.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule

import { MailerModule } from '@nestjs-modules/mailer';
import mailerConfig from './config/mailer.config';
import { MailModule } from './mail/mail.module';
import { TestController } from './test/test.controller'; // <--- NEW IMPORT

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigService available throughout the app
      load: [databaseConfig, authConfig, mailerConfig], // Load both database, auth and mailer configurations
      envFilePath: '.env', // Specify the path to the .env file
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('mailer'),
      }),
    }),
    ScheduleModule.forRoot(),

    // Feature Modules
    AbsenceModule,
    HolidaysModule,
    DateUtilsModule,
    MailModule,

    // Core Modules (moved to the end)
    UsersModule,
    AuthModule,
    InvitationsModule,
  ],
  controllers: [AppController, TestController], // <--- ADD TestController
  providers: [AppService],
})
export class AppModule {}

