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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidaysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const holidays_entity_1 = require("./holidays.entity");
let HolidaysService = class HolidaysService {
    constructor(holidaysRepository) {
        this.holidaysRepository = holidaysRepository;
    }
    async create(holiday) {
        const newHoliday = this.holidaysRepository.create(holiday);
        return this.holidaysRepository.save(newHoliday);
    }
    async findOne(date, region) {
        return this.holidaysRepository.findOne({ where: { date, region } });
    }
    async isHoliday(date, region) {
        const holiday = await this.holidaysRepository.findOne({
            where: [
                { date, region },
                { date, region: 'DE' },
            ],
        });
        return !!holiday;
    }
    async getHolidaysInRange(startDate, endDate, region) {
        return this.holidaysRepository.find({
            where: {
                date: (0, typeorm_2.Between)(startDate, endDate),
                region: (0, typeorm_2.In)([region, 'DE']),
            },
            order: {
                date: 'ASC',
            }
        });
    }
};
exports.HolidaysService = HolidaysService;
exports.HolidaysService = HolidaysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(holidays_entity_1.Holiday)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HolidaysService);
//# sourceMappingURL=holidays.service.js.map