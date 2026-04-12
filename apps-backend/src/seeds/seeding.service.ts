import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HolidaySeeder } from './holiday.seeder';
import { SuperAdminSeeder } from './superadmin.seeder';

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly holidaySeeder: HolidaySeeder,
    private readonly superAdminSeeder: SuperAdminSeeder,
  ) {}

  async resetAndSeed() {
    this.logger.log('Resetting and seeding database...');
    
    try {
      // Clear all tables instead of synchronize(true) which can cause "duplicate key value" in Postgres metadata
      this.logger.log('Clearing database tables...');
      const entities = this.dataSource.entityMetadatas;
      const tableNames = entities
        .map((entity) => `"${entity.tableName}"`)
        .join(', ');

      if (tableNames) {
        await this.dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
      }
      this.logger.log('Database cleared.');

      this.logger.log('Seeding holidays...');
      await this.holidaySeeder.seed();
      
      this.logger.log('Seeding SuperAdmin...');
      await this.superAdminSeeder.seed();
      
      this.logger.log('Seeding complete!');
    } catch (error: any) {
      this.logger.error('Seeding failed!', error.stack);
      throw error;
    }
  }
}
