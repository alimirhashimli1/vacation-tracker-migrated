"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HolidaySeeder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidaySeeder = void 0;
const common_1 = require("@nestjs/common");
const holidays_service_1 = require("../holidays/holidays.service");
const holidays_entity_1 = require("../holidays/holidays.entity");
let HolidaySeeder = HolidaySeeder_1 = class HolidaySeeder {
    constructor(holidaysService) {
        this.holidaysService = holidaysService;
        this.logger = new common_1.Logger(HolidaySeeder_1.name);
    }
    async seed() {
        this.logger.log('Seeding German holidays...');
        const year = new Date().getFullYear();
        const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/DE`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch holidays: ${response.statusText}`);
            }
            const holidays = await response.json();
            for (const holiday of holidays) {
                const regions = holiday.counties && holiday.counties.length > 0 ? holiday.counties : ['DE'];
                for (const region of regions) {
                    const existingHoliday = await this.holidaysService.findOne(new Date(holiday.date), region);
                    if (!existingHoliday) {
                        const holidayEntity = new holidays_entity_1.Holiday();
                        holidayEntity.date = new Date(holiday.date);
                        holidayEntity.name = holiday.name;
                        holidayEntity.region = region;
                        await this.holidaysService.create(holidayEntity);
                    }
                }
            }
            this.logger.log('Finished seeding holidays.');
        }
        catch (error) {
            this.logger.error('Error seeding holidays:', error);
        }
    }
};
exports.HolidaySeeder = HolidaySeeder;
exports.HolidaySeeder = HolidaySeeder = HolidaySeeder_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [holidays_service_1.HolidaysService])
], HolidaySeeder);
//# sourceMappingURL=holiday.seeder.js.map