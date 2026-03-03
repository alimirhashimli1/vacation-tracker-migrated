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
exports.AbsenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const absence_entity_1 = require("./absence.entity");
const uuid_1 = require("uuid");
const absence_type_enum_1 = require("../shared/absence-type.enum");
const absence_status_enum_1 = require("../shared/absence-status.enum");
const absence_balance_service_1 = require("./absence-balance.service");
const date_utils_1 = require("../utils/date.utils");
const users_service_1 = require("../users/users.service");
const typeorm_3 = require("typeorm");
let AbsenceService = class AbsenceService {
    constructor(absenceRepository, absenceBalanceService, dateUtils, usersService, dataSource) {
        this.absenceRepository = absenceRepository;
        this.absenceBalanceService = absenceBalanceService;
        this.dateUtils = dateUtils;
        this.usersService = usersService;
        this.dataSource = dataSource;
    }
    async calculateRequestedDays(startDate, endDate, userId) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${userId} not found when calculating requested days.`);
        }
        return this.dateUtils.getWorkingDaysBetween(startDate, endDate, user.region);
    }
    async create(dto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (startDate > endDate) {
            throw new common_1.BadRequestException('Start date cannot be after end date.');
        }
        if (dto.type === absence_type_enum_1.AbsenceType.VACATION && startDate.getFullYear() !== endDate.getFullYear()) {
            throw new common_1.BadRequestException('Vacation requests cannot span multiple years.');
        }
        const requestedDays = await this.calculateRequestedDays(startDate, endDate, dto.userId);
        if (requestedDays === 0) {
            throw new common_1.BadRequestException('Public holidays cannot be requested.');
        }
        const allApprovedAbsences = await this.absenceRepository.find({
            where: {
                userId: dto.userId,
                status: absence_status_enum_1.AbsenceStatus.APPROVED,
            },
        });
        const isOverlapping = allApprovedAbsences.some(existingAbsence => {
            const newStart = new Date(dto.startDate);
            const newEnd = new Date(dto.endDate);
            const existingStart = existingAbsence.startDate;
            const existingEnd = existingAbsence.endDate;
            return (newStart <= existingEnd && newEnd >= existingStart);
        });
        if (isOverlapping) {
            throw new common_1.BadRequestException('Date overlaps with existing absence.');
        }
        if (dto.type === absence_type_enum_1.AbsenceType.VACATION) {
            const year = startDate.getFullYear();
            const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(dto.userId, year);
            const usedDaysBeforeThisRequest = await this.absenceBalanceService.getUsedVacationDays(dto.userId, year);
            const availableDays = yearlyAllowance - usedDaysBeforeThisRequest;
            if (requestedDays > availableDays) {
                throw new common_1.BadRequestException('Vacation balance exceeded.');
            }
        }
        const newAbsence = this.absenceRepository.create({
            id: (0, uuid_1.v4)(),
            userId: dto.userId,
            startDate: startDate,
            endDate: endDate,
            type: dto.type,
            status: absence_status_enum_1.AbsenceStatus.PENDING,
            requestedDays: requestedDays,
            approvedDays: 0,
        });
        const savedAbsence = await this.absenceRepository.save(newAbsence);
        return this.mapToResponseDto(savedAbsence);
    }
    async findAll() {
        const absences = await this.absenceRepository.find();
        return absences.map(absence => this.mapToResponseDto(absence));
    }
    async findOne(id) {
        const absence = await this.absenceRepository.findOneBy({ id });
        if (!absence) {
            throw new common_1.NotFoundException(`Absence with id ${id} not found`);
        }
        return this.mapToResponseDto(absence);
    }
    async update(id, updateDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const absence = await queryRunner.manager.findOneBy(absence_entity_1.Absence, { id });
            if (!absence) {
                throw new common_1.NotFoundException(`Absence with id ${id} not found`);
            }
            const originalAbsenceStatus = absence.status;
            const originalApprovedDays = absence.approvedDays;
            const originalAbsenceType = absence.type;
            if ((originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.APPROVED || originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.REJECTED) &&
                updateDto.status && updateDto.status !== originalAbsenceStatus) {
                throw new common_1.BadRequestException(`Cannot change the status of an already ${originalAbsenceStatus} absence.`);
            }
            Object.assign(absence, updateDto);
            const updatedStartDate = this.dateUtils.parseDate(updateDto.startDate || absence.startDate);
            const updatedEndDate = this.dateUtils.parseDate(updateDto.endDate || absence.endDate);
            absence.startDate = updatedStartDate;
            absence.endDate = updatedEndDate;
            if (updatedStartDate > updatedEndDate) {
                throw new common_1.BadRequestException('Start date cannot be after end date.');
            }
            if (absence.type === absence_type_enum_1.AbsenceType.VACATION && updatedStartDate.getFullYear() !== updatedEndDate.getFullYear()) {
                throw new common_1.BadRequestException('Vacation requests cannot span multiple years.');
            }
            absence.requestedDays = await this.calculateRequestedDays(updatedStartDate, updatedEndDate, absence.userId);
            if (absence.requestedDays === 0) {
                throw new common_1.BadRequestException('Public holidays cannot be requested.');
            }
            const allApprovedAbsences = await queryRunner.manager.find(absence_entity_1.Absence, {
                where: {
                    userId: absence.userId,
                    status: absence_status_enum_1.AbsenceStatus.APPROVED,
                },
            });
            const isOverlapping = allApprovedAbsences.some(existingAbsence => {
                if (existingAbsence.id === id) {
                    return false;
                }
                const newStart = updatedStartDate;
                const newEnd = updatedEndDate;
                const existingStart = existingAbsence.startDate;
                const existingEnd = existingAbsence.endDate;
                return (newStart <= existingEnd && newEnd >= existingStart);
            });
            if (isOverlapping) {
                throw new common_1.BadRequestException('Date overlaps with existing absence.');
            }
            if (absence.status === absence_status_enum_1.AbsenceStatus.APPROVED) {
                if (updateDto.approvedDays !== undefined) {
                    if (updateDto.approvedDays < 0) {
                        throw new common_1.BadRequestException('Approved days cannot be negative.');
                    }
                    if (updateDto.approvedDays > absence.requestedDays) {
                        throw new common_1.BadRequestException(`Approved days (${updateDto.approvedDays}) cannot exceed requested days (${absence.requestedDays}).`);
                    }
                    absence.approvedDays = updateDto.approvedDays;
                }
                else {
                    absence.approvedDays = absence.requestedDays;
                }
            }
            else {
                absence.approvedDays = 0;
            }
            if (absence.type === absence_type_enum_1.AbsenceType.VACATION || updateDto.type === absence_type_enum_1.AbsenceType.VACATION || originalAbsenceType === absence_type_enum_1.AbsenceType.VACATION) {
                const targetUserId = absence.userId;
                const targetYear = updatedStartDate.getFullYear();
                const yearlyAllowance = await this.absenceBalanceService.getYearlyAllowance(targetUserId, targetYear);
                let usedDaysForYearExcludingCurrentAbsence = await this.absenceBalanceService.getUsedVacationDays(targetUserId, targetYear);
                if (originalAbsenceType === absence_type_enum_1.AbsenceType.VACATION && originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.APPROVED) {
                    usedDaysForYearExcludingCurrentAbsence -= originalApprovedDays;
                }
                const availableDays = yearlyAllowance - usedDaysForYearExcludingCurrentAbsence;
                if (absence.type === absence_type_enum_1.AbsenceType.VACATION && absence.status === absence_status_enum_1.AbsenceStatus.APPROVED) {
                    if (absence.approvedDays > availableDays) {
                        throw new common_1.BadRequestException('Vacation balance exceeded.');
                    }
                }
                else if (absence.type === absence_type_enum_1.AbsenceType.VACATION) {
                }
            }
            const updatedAbsence = await queryRunner.manager.save(absence_entity_1.Absence, absence);
            if (queryRunner.isTransactionActive) {
                await queryRunner.commitTransaction();
            }
            return this.mapToResponseDto(updatedAbsence);
        }
        catch (err) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async remove(id) {
        const result = await this.absenceRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Absence with id ${id} not found`);
        }
    }
    mapToResponseDto(absence) {
        return {
            id: absence.id,
            userId: absence.userId,
            startDate: this.dateUtils.parseDate(absence.startDate).toISOString(),
            endDate: this.dateUtils.parseDate(absence.endDate).toISOString(),
            type: absence.type,
            status: absence.status,
            requestedDays: absence.requestedDays,
            approvedDays: absence.approvedDays,
            totalHours: absence.totalHours,
            cost: absence.cost,
            createdAt: absence.createdAt,
            updatedAt: absence.updatedAt,
        };
    }
    async getApprovedVacationsForYear(userId, year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return this.absenceRepository.find({
            where: {
                userId,
                status: absence_status_enum_1.AbsenceStatus.APPROVED,
                type: absence_type_enum_1.AbsenceType.VACATION,
                startDate: (0, typeorm_2.Between)(startDate, endDate),
            },
        });
    }
};
exports.AbsenceService = AbsenceService;
exports.AbsenceService = AbsenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(absence_entity_1.Absence)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        absence_balance_service_1.AbsenceBalanceService,
        date_utils_1.DateUtils,
        users_service_1.UsersService,
        typeorm_3.DataSource])
], AbsenceService);
//# sourceMappingURL=absence.service.js.map