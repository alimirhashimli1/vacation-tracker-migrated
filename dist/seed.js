"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const core_1 = require("@nestjs/core");
const seeder_module_1 = require("./seeds/seeder.module");
const holiday_seeder_1 = require("./seeds/holiday.seeder");
const superadmin_seeder_1 = require("./seeds/superadmin.seeder");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
async function bootstrap() {
    const appContext = await core_1.NestFactory.createApplicationContext(seeder_module_1.SeederModule);
    const logger = new common_1.Logger('Seeder');
    logger.log('Synchronizing database schema...');
    const dataSource = appContext.get(typeorm_1.DataSource);
    await dataSource.synchronize(true);
    logger.log('Database schema synchronized.');
    const holidaySeeder = appContext.get(holiday_seeder_1.HolidaySeeder);
    const superAdminSeeder = appContext.get(superadmin_seeder_1.SuperAdminSeeder);
    try {
        logger.log('Seeding...');
        await holidaySeeder.seed();
        await superAdminSeeder.seed();
        logger.log('Seeding complete!');
    }
    catch (error) {
        logger.error('Seeding failed!', error.stack);
        throw error;
    }
    finally {
        await appContext.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map