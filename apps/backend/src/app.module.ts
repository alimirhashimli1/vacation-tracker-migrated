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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigService available throughout the app
      load: [databaseConfig, authConfig], // Load both database and auth configurations
      envFilePath: '.env', // Specify the path to the .env file
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    AbsenceModule,
    UsersModule, // Add UsersModule here
    AuthModule, // Add AuthModule here
    HolidaysModule,
    DateUtilsModule,
    InvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

