import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VacationModule } from './vacation/vacation.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module'; // Import UsersModule
import { AuthModule } from './auth/auth.module'; // Import AuthModule
import authConfig from './config/auth.config'; // Import authConfig

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
    VacationModule,
    UsersModule, // Add UsersModule here
    AuthModule, // Add AuthModule here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

