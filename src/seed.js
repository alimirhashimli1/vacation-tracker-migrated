"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config(); // MUST be the first line
const core_1 = require("@nestjs/core");
const seeder_module_1 = require("./seeds/seeder.module");
const holiday_seeder_1 = require("./seeds/holiday.seeder");
const superadmin_seeder_1 = require("./seeds/superadmin.seeder");
const common_1 = require("@nestjs/common");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const appContext = yield core_1.NestFactory.createApplicationContext(seeder_module_1.SeederModule);
        const logger = new common_1.Logger('Seeder');
        const holidaySeeder = appContext.get(holiday_seeder_1.HolidaySeeder);
        const superAdminSeeder = appContext.get(superadmin_seeder_1.SuperAdminSeeder);
        try {
            logger.log('Seeding...');
            yield holidaySeeder.seed();
            yield superAdminSeeder.seed();
            logger.log('Seeding complete!');
        }
        catch (error) {
            logger.error('Seeding failed!', error.stack);
            throw error;
        }
        finally {
            yield appContext.close();
        }
    });
}
bootstrap();
