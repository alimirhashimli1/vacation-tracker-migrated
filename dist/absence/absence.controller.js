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
exports.AbsenceController = void 0;
const common_1 = require("@nestjs/common");
const absence_service_1 = require("./absence.service");
const create_absence_dto_1 = require("../shared/create-absence.dto");
const update_absence_dto_1 = require("../shared/update-absence.dto");
const update_absence_status_dto_1 = require("../shared/update-absence-status.dto");
const roles_guard_1 = require("../shared/auth/roles.guard");
const roles_decorator_1 = require("../shared/auth/roles.decorator");
const role_enum_1 = require("../shared/role.enum");
const jwt_auth_guard_1 = require("../shared/auth/jwt-auth.guard");
let AbsenceController = class AbsenceController {
    constructor(absenceService) {
        this.absenceService = absenceService;
    }
    async create(req, createAbsenceDto) {
        const authenticatedUser = req.user;
        if (authenticatedUser.role === role_enum_1.Role.Employee && authenticatedUser.userId !== createAbsenceDto.userId) {
            throw new common_1.ForbiddenException('Employees can only create absence requests for themselves.');
        }
        return this.absenceService.create(createAbsenceDto);
    }
    async findAll() {
        return this.absenceService.findAll();
    }
    async findOne(id) {
        return this.absenceService.findOne(id);
    }
    async update(id, updateAbsenceDto) {
        return this.absenceService.update(id, updateAbsenceDto);
    }
    async updateStatus(id, updateAbsenceStatusDto) {
        return this.absenceService.update(id, updateAbsenceStatusDto);
    }
    async remove(id) {
        return this.absenceService.remove(id);
    }
};
exports.AbsenceController = AbsenceController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Employee, role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_absence_dto_1.CreateAbsenceDto]),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Employee, role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_absence_dto_1.UpdateAbsenceDto]),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_absence_status_dto_1.UpdateAbsenceStatusDto]),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AbsenceController.prototype, "remove", null);
exports.AbsenceController = AbsenceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('absences'),
    __metadata("design:paramtypes", [absence_service_1.AbsenceService])
], AbsenceController);
//# sourceMappingURL=absence.controller.js.map