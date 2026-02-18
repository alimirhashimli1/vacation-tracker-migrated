"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.AbsenceController = void 0;
const common_1 = require("@nestjs/common");
const roles_guard_1 = require("../../../../shared/auth/roles.guard");
const roles_decorator_1 = require("../../../../shared/auth/roles.decorator");
const role_enum_1 = require("../../../../shared/role.enum");
const jwt_auth_guard_1 = require("../../../../shared/auth/jwt-auth.guard");
let AbsenceController = (() => {
    let _classDecorators = [(0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, common_1.Controller)('absences')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _updateStatus_decorators;
    let _remove_decorators;
    var AbsenceController = _classThis = class {
        constructor(absenceService) {
            this.absenceService = (__runInitializers(this, _instanceExtraInitializers), absenceService);
        }
        create(req, createAbsenceDto) {
            return __awaiter(this, void 0, void 0, function* () {
                const authenticatedUser = req.user;
                // Rule: EMPLOYEE can create absences for themselves only
                if (authenticatedUser.role === role_enum_1.Role.Employee && authenticatedUser.userId !== createAbsenceDto.userId) {
                    throw new common_1.ForbiddenException('Employees can only create absence requests for themselves.');
                }
                // ADMIN / SUPERADMIN can create for others (already handled by @Roles decorator and the check above)
                // No explicit check needed here for ADMIN/SUPERADMIN as they are allowed.
                return this.absenceService.create(createAbsenceDto);
            });
        }
        findAll() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.absenceService.findAll();
            });
        }
        findOne(id) {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: Add logic to ensure Employee only views their own absence
                return this.absenceService.findOne(id);
            });
        }
        update(id, updateAbsenceDto) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.absenceService.update(id, updateAbsenceDto);
            });
        }
        updateStatus(id, updateAbsenceStatusDto) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.absenceService.update(id, updateAbsenceStatusDto);
            });
        }
        remove(id) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.absenceService.remove(id);
            });
        }
    };
    __setFunctionName(_classThis, "AbsenceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(role_enum_1.Role.Employee, role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        _findAll_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, roles_decorator_1.Roles)(role_enum_1.Role.Employee, role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        _updateStatus_decorators = [(0, common_1.Patch)(':id/status'), (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin)];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateStatus_decorators, { kind: "method", name: "updateStatus", static: false, private: false, access: { has: obj => "updateStatus" in obj, get: obj => obj.updateStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AbsenceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AbsenceController = _classThis;
})();
exports.AbsenceController = AbsenceController;
