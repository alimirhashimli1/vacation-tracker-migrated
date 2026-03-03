"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtilsModule = void 0;
const common_1 = require("@nestjs/common");
const holidays_module_1 = require("../holidays/holidays.module");
const date_utils_1 = require("./date.utils");
let DateUtilsModule = class DateUtilsModule {
};
exports.DateUtilsModule = DateUtilsModule;
exports.DateUtilsModule = DateUtilsModule = __decorate([
    (0, common_1.Module)({
        imports: [holidays_module_1.HolidaysModule],
        providers: [date_utils_1.DateUtils],
        exports: [date_utils_1.DateUtils],
    })
], DateUtilsModule);
//# sourceMappingURL=date.utils.module.js.map