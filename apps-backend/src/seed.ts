try {
  require('dotenv').config();
} catch (e) {
  // Silent fail in environments where .env is not present (e.g. production)
}
import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeds/seeder.module';
import { SeedingService } from './seeds/seeding.service';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);

  const logger = new Logger('Seeder');

  // For standalone seeding, we want to sync the schema
  logger.log('Synchronizing database schema...');
  const dataSource = appContext.get(DataSource);
  await dataSource.synchronize(true);
  logger.log('Database schema synchronized.');

  const seedingService = appContext.get(SeedingService);

  try {
    // Note: seedingService.resetAndSeed() now uses TRUNCATE internally, 
    // but synchronize(true) above ensured schema is correct.
    await seedingService.resetAndSeed();
  } catch (error: any) {
    logger.error('Seeding process failed!', error.stack);
    throw error;
  } finally {
    await appContext.close();
  }
}

bootstrap();
