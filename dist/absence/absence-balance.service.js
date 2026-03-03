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
exports.AbsenceBalanceService = void 0;
const common_1 = require("@nestjs/common");
const absence_service_1 = require("./absence.service");
const date_utils_1 = require("../utils/date.utils");
const users_service_1 = require("../users/users.service");
let AbsenceBalanceService = class AbsenceBalanceService {
    constructor(absenceService, dateUtils, usersService) {
        this.absenceService = absenceService;
        this.dateUtils = dateUtils;
        this.usersService = usersService;
    }
    async getYearlyAllowance(userId, year) {
        return 30;
    }
    async getUsedVacationDays(userId, year) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${userId} not found`);
        }
        const absences = await this.absenceService.getApprovedVacationsForYear(userId, year);
        return absences.reduce((total, absence) => total + absence.approvedDays, 0);
    }
    async getRemainingVacationDays(userId, year) {
        const allowance = await this.getYearlyAllowance(userId, year);
        const usedDays = await this.getUsedVacationDays(userId, year);
        return allowance - usedDays;
    }
};
exports.AbsenceBalanceService = AbsenceBalanceService;
exports.AbsenceBalanceService = AbsenceBalanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => absence_service_1.AbsenceService))),
    __metadata("design:paramtypes", [absence_service_1.AbsenceService,
        date_utils_1.DateUtils,
        users_service_1.UsersService])
], AbsenceBalanceService);
//# sourceMappingURL=absence-balance.service.js.map