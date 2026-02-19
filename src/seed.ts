require('dotenv').config(); // MUST be the first line
import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeds/seeder.module';
import { HolidaySeeder } from './seeds/holiday.seeder';
import { SuperAdminSeeder } from './seeds/superadmin.seeder';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm'; // <-- Import DataSource

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  
  const logger = new Logger('Seeder');
  
  // Manually synchronize the database schema before seeding
  logger.log('Synchronizing database schema...');
  const dataSource = appContext.get(DataSource);
  await dataSource.synchronize(true); // Pass true to drop and recreate schema, ensuring a clean state
  logger.log('Database schema synchronized.');

  const holidaySeeder = appContext.get(HolidaySeeder);
  const superAdminSeeder = appContext.get(SuperAdminSeeder);

  try {
    logger.log('Seeding...');
    await holidaySeeder.seed();
    await superAdminSeeder.seed();
    logger.log('Seeding complete!');
  } catch (error: any) {
    logger.error('Seeding failed!', error.stack);
    throw error;
  } finally {
    await appContext.close();
  }
}

bootstrap();
