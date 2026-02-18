"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const absence_entity_1 = require("./absence.entity"); // This will be Absence entity
const uuid_1 = require("uuid");
const absence_type_enum_1 = require("../../../../shared/absence-type.enum");
const absence_status_enum_1 = require("../../../../shared/absence-status.enum");
let AbsenceService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AbsenceService = _classThis = class {
        constructor(absenceRepository, absenceBalanceService, dateUtils, // Inject DateUtils
        usersService, // Inject UsersService
        dataSource) {
            this.absenceRepository = absenceRepository;
            this.absenceBalanceService = absenceBalanceService;
            this.dateUtils = dateUtils;
            this.usersService = usersService;
            this.dataSource = dataSource;
        }
        calculateRequestedDays(startDate, endDate, userId) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield this.usersService.findOneById(userId);
                if (!user) {
                    throw new common_1.NotFoundException(`User with id ${userId} not found when calculating requested days.`);
                }
                return this.dateUtils.getWorkingDaysBetween(startDate, endDate, user.region);
            });
        }
        create(dto) {
            return __awaiter(this, void 0, void 0, function* () {
                const startDate = new Date(dto.startDate);
                const endDate = new Date(dto.endDate);
                if (startDate > endDate) {
                    throw new common_1.BadRequestException('Start date cannot be after end date.');
                }
                if (dto.type === absence_type_enum_1.AbsenceType.VACATION && startDate.getFullYear() !== endDate.getFullYear()) {
                    throw new common_1.BadRequestException('Vacation requests cannot span multiple years.');
                }
                const requestedDays = yield this.calculateRequestedDays(startDate, endDate, dto.userId);
                if (requestedDays === 0) {
                    throw new common_1.BadRequestException('Public holidays cannot be requested.');
                }
                // Overlap validation
                const allApprovedAbsences = yield this.absenceRepository.find({
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
                    // Overlap if:
                    // The new period starts within or before the existing period, and ends within or after the existing period.
                    return (newStart <= existingEnd && newEnd >= existingStart);
                });
                if (isOverlapping) {
                    throw new common_1.BadRequestException('Date overlaps with existing absence.');
                }
                if (dto.type === absence_type_enum_1.AbsenceType.VACATION) {
                    const year = startDate.getFullYear();
                    const yearlyAllowance = yield this.absenceBalanceService.getYearlyAllowance(dto.userId, year);
                    const usedDaysBeforeThisRequest = yield this.absenceBalanceService.getUsedVacationDays(dto.userId, year);
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
                    approvedDays: 0, // Initially 0
                });
                const savedAbsence = yield this.absenceRepository.save(newAbsence);
                return this.mapToResponseDto(savedAbsence);
            });
        }
        findAll() {
            return __awaiter(this, void 0, void 0, function* () {
                const absences = yield this.absenceRepository.find();
                return absences.map(this.mapToResponseDto);
            });
        }
        findOne(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const absence = yield this.absenceRepository.findOneBy({ id });
                if (!absence) {
                    throw new common_1.NotFoundException(`Absence with id ${id} not found`);
                }
                return this.mapToResponseDto(absence);
            });
        }
        update(id, updateDto) {
            return __awaiter(this, void 0, void 0, function* () {
                const queryRunner = this.dataSource.createQueryRunner();
                yield queryRunner.connect();
                yield queryRunner.startTransaction();
                try {
                    const absence = yield queryRunner.manager.findOneBy(absence_entity_1.Absence, { id });
                    if (!absence) {
                        throw new common_1.NotFoundException(`Absence with id ${id} not found`);
                    }
                    const originalAbsenceStatus = absence.status;
                    const originalApprovedDays = absence.approvedDays;
                    const originalAbsenceType = absence.type;
                    // Check if the absence is already in a terminal state (APPROVED or REJECTED)
                    // and prevent further status changes.
                    if ((originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.APPROVED || originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.REJECTED) &&
                        updateDto.status && updateDto.status !== originalAbsenceStatus) {
                        throw new common_1.BadRequestException(`Cannot change the status of an already ${originalAbsenceStatus} absence.`);
                    }
                    Object.assign(absence, updateDto);
                    const updatedStartDate = updateDto.startDate ? new Date(updateDto.startDate) : absence.startDate;
                    const updatedEndDate = updateDto.endDate ? new Date(updateDto.endDate) : absence.endDate;
                    if (updatedStartDate > updatedEndDate) {
                        throw new common_1.BadRequestException('Start date cannot be after end date.');
                    }
                    if (absence.type === absence_type_enum_1.AbsenceType.VACATION && updatedStartDate.getFullYear() !== updatedEndDate.getFullYear()) {
                        throw new common_1.BadRequestException('Vacation requests cannot span multiple years.');
                    }
                    absence.requestedDays = yield this.calculateRequestedDays(updatedStartDate, updatedEndDate, absence.userId);
                    if (absence.requestedDays === 0) {
                        throw new common_1.BadRequestException('Public holidays cannot be requested.');
                    }
                    // Overlap validation for update
                    const allApprovedAbsences = yield queryRunner.manager.find(absence_entity_1.Absence, {
                        where: {
                            userId: absence.userId,
                            status: absence_status_enum_1.AbsenceStatus.APPROVED,
                        },
                    });
                    const isOverlapping = allApprovedAbsences.some(existingAbsence => {
                        // Exclude the current absence being updated from overlap check
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
                    // Handle approvedDays logic, including partial approvals
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
                            // If status is approved and no specific approved days are provided, approve all requested days.
                            absence.approvedDays = absence.requestedDays;
                        }
                    }
                    else {
                        // For any other status, approved days should be 0.
                        absence.approvedDays = 0;
                    }
                    // Validation for VACATION type absences
                    if (absence.type === absence_type_enum_1.AbsenceType.VACATION || updateDto.type === absence_type_enum_1.AbsenceType.VACATION || originalAbsenceType === absence_type_enum_1.AbsenceType.VACATION) {
                        const targetUserId = absence.userId;
                        const targetYear = updatedStartDate.getFullYear();
                        const yearlyAllowance = yield this.absenceBalanceService.getYearlyAllowance(targetUserId, targetYear);
                        let usedDaysForYearExcludingCurrentAbsence = yield this.absenceBalanceService.getUsedVacationDays(targetUserId, targetYear);
                        // If the absence being updated was an approved VACATION *before* this update,
                        // its original approvedDays need to be excluded from the `usedDaysForYear` calculation
                        // to correctly determine the available balance for the *new* requestedDays and status.
                        // This step is crucial if the new status is APPROVED and its type is VACATION.
                        if (originalAbsenceType === absence_type_enum_1.AbsenceType.VACATION && originalAbsenceStatus === absence_status_enum_1.AbsenceStatus.APPROVED) {
                            usedDaysForYearExcludingCurrentAbsence -= originalApprovedDays;
                        }
                        const availableDays = yearlyAllowance - usedDaysForYearExcludingCurrentAbsence;
                        // Now, if the current (post-updateDto) absence is a VACATION type and APPROVED,
                        // check if its requestedDays (which became approvedDays) would exceed the available balance.
                        if (absence.type === absence_type_enum_1.AbsenceType.VACATION && absence.status === absence_status_enum_1.AbsenceStatus.APPROVED) {
                            if (absence.approvedDays > availableDays) {
                                throw new common_1.BadRequestException('Vacation balance exceeded.');
                            }
                        }
                        else if (absence.type === absence_type_enum_1.AbsenceType.VACATION) { // If it's a VACATION type but not approved (PENDING/REJECTED),
                            // still ensure requestedDays don't exceed future approval limits.
                            // Let's refine this to only check balance when approving.
                        }
                    }
                    const updatedAbsence = yield queryRunner.manager.save(absence_entity_1.Absence, absence);
                    yield queryRunner.commitTransaction();
                    return this.mapToResponseDto(updatedAbsence);
                }
                catch (err) {
                    yield queryRunner.rollbackTransaction();
                    throw err;
                }
                finally {
                    yield queryRunner.release();
                }
            });
        }
        remove(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.absenceRepository.delete(id);
                if (result.affected === 0) {
                    throw new common_1.NotFoundException(`Absence with id ${id} not found`);
                }
            });
        }
        mapToResponseDto(absence) {
            return {
                id: absence.id,
                userId: absence.userId,
                startDate: absence.startDate,
                endDate: absence.endDate,
                type: absence.type,
                status: absence.status,
                requestedDays: absence.requestedDays,
                approvedDays: absence.approvedDays,
                createdAt: absence.createdAt,
                updatedAt: absence.updatedAt,
            };
        }
        getApprovedVacationsForYear(userId, year) {
            return __awaiter(this, void 0, void 0, function* () {
                const startDate = new Date(year, 0, 1);
                const endDate = new Date(year, 11, 31);
                return this.absenceRepository.find({
                    where: {
                        userId,
                        status: absence_status_enum_1.AbsenceStatus.APPROVED,
                        type: absence_type_enum_1.AbsenceType.VACATION,
                        startDate: (0, typeorm_1.Between)(startDate, endDate),
                    },
                });
            });
        }
    };
    __setFunctionName(_classThis, "AbsenceService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AbsenceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AbsenceService = _classThis;
})();
exports.AbsenceService = AbsenceService;
