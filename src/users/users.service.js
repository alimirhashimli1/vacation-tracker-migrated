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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("./user.entity");
const role_enum_1 = require("../../../../shared/role.enum");
let UsersService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsersService = _classThis = class {
        constructor(usersRepository, authService) {
            this.usersRepository = usersRepository;
            this.authService = authService;
        }
        create(createUserDto, manager) {
            return __awaiter(this, void 0, void 0, function* () {
                const repository = manager ? manager.getRepository(user_entity_1.User) : this.usersRepository;
                if (createUserDto.role === role_enum_1.Role.SuperAdmin) {
                    throw new common_1.BadRequestException('Cannot create a user with SuperAdmin role via this endpoint.');
                }
                const hashedPassword = yield this.authService.hashPassword(createUserDto.password);
                const newUser = repository.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword }));
                const _a = yield repository.save(newUser), { password } = _a, result = __rest(_a, ["password"]);
                return result;
            });
        }
        findOneByEmail(email_1) {
            return __awaiter(this, arguments, void 0, function* (email, selectPassword = false) {
                if (selectPassword) {
                    return this.usersRepository.findOne({ where: { email }, select: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isActive', 'createdAt', 'updatedAt'] });
                }
                const user = yield this.usersRepository.findOne({ where: { email } });
                if (!user)
                    return null;
                const { password } = user, result = __rest(user, ["password"]);
                return result;
            });
        }
        findOneById(id_1) {
            return __awaiter(this, arguments, void 0, function* (id, selectSensitiveData = false) {
                const user = yield this.usersRepository.findOne({ where: { id } });
                if (!user) {
                    throw new common_1.NotFoundException(`User with ID ${id} not found`);
                }
                if (selectSensitiveData) {
                    return user;
                }
                const { password } = user, result = __rest(user, ["password"]);
                return result;
            });
        }
        findAll() {
            return __awaiter(this, void 0, void 0, function* () {
                const users = yield this.usersRepository.find();
                return users.map(user => {
                    const { password } = user, result = __rest(user, ["password"]);
                    return result;
                });
            });
        }
        update(id, updateUserDto) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield this.usersRepository.preload(Object.assign({ id }, updateUserDto));
                if (!user) {
                    throw new common_1.NotFoundException(`User with ID ${id} not found`);
                }
                if (updateUserDto.password) {
                    user.password = yield this.authService.hashPassword(updateUserDto.password);
                }
                const _a = yield this.usersRepository.save(user), { password } = _a, result = __rest(_a, ["password"]);
                return result;
            });
        }
        remove(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const userToDelete = yield this.usersRepository.findOne({ where: { id } });
                if (!userToDelete) {
                    throw new common_1.NotFoundException(`User with ID ${id} not found.`);
                }
                if (userToDelete.role === role_enum_1.Role.SuperAdmin) {
                    throw new common_1.ForbiddenException('Cannot delete SuperAdmin users.');
                }
                yield this.usersRepository.delete(id);
            });
        }
    };
    __setFunctionName(_classThis, "UsersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
})();
exports.UsersService = UsersService;
