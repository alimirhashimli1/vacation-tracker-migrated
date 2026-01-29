import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeds/seeder.module';
import { HolidaySeeder } from './seeds/holiday.seeder';
import { SuperAdminSeeder } from './seeds/superadmin.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  
  const logger = new Logger('Seeder');
  const holidaySeeder = appContext.get(HolidaySeeder);
  const superAdminSeeder = appContext.get(SuperAdminSeeder);

  try {
    logger.log('Seeding...');
    await holidaySeeder.seed();
    await superAdminSeeder.seed();
    logger.log('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed!', error.stack);
    throw error;
  } finally {
    await appContext.close();
  }
}

bootstrap();
