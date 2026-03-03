"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsenceModule = void 0;
const common_1 = require("@nestjs/common");
const absence_controller_1 = require("./absence.controller");
const absence_service_1 = require("./absence.service");
const typeorm_1 = require("@nestjs/typeorm");
const absence_entity_1 = require("./absence.entity");
const date_utils_module_1 = require("../utils/date.utils.module");
const users_module_1 = require("../users/users.module");
const absence_balance_service_1 = require("./absence-balance.service");
let AbsenceModule = class AbsenceModule {
};
exports.AbsenceModule = AbsenceModule;
exports.AbsenceModule = AbsenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([absence_entity_1.Absence]),
            date_utils_module_1.DateUtilsModule,
            users_module_1.UsersModule,
        ],
        controllers: [absence_controller_1.AbsenceController],
        providers: [absence_service_1.AbsenceService, absence_balance_service_1.AbsenceBalanceService],
        exports: [absence_service_1.AbsenceService, absence_balance_service_1.AbsenceBalanceService],
    })
], AbsenceModule);
//# sourceMappingURL=absence.module.js.map