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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const holidays_service_1 = require("../holidays/holidays.service");
let DateUtils = class DateUtils {
    constructor(holidaysService) {
        this.holidaysService = holidaysService;
    }
    parseDate(dateInput) {
        if (dateInput instanceof Date) {
            return dateInput;
        }
        if (typeof dateInput !== 'string') {
            throw new Error(`Invalid date input type: ${typeof dateInput}. Expected string or Date.`);
        }
        const parsedDate = (0, date_fns_1.parseISO)(dateInput);
        if (!(0, date_fns_1.isValid)(parsedDate)) {
            throw new Error(`Invalid date format for: ${dateInput}`);
        }
        return parsedDate;
    }
    isWeekend(date) {
        return (0, date_fns_1.isWeekend)(date);
    }
    async getWorkingDaysBetween(startDate, endDate, region) {
        let workingDays = 0;
        const currentDate = new Date(startDate.toISOString());
        while (currentDate <= endDate) {
            if (!this.isWeekend(currentDate) && !(await this.holidaysService.isHoliday(currentDate, region))) {
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return workingDays;
    }
};
exports.DateUtils = DateUtils;
exports.DateUtils = DateUtils = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [holidays_service_1.HolidaysService])
], DateUtils);
//# sourceMappingURL=date.utils.js.map