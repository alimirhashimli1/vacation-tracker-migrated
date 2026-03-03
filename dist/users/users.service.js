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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const auth_service_1 = require("../auth/auth.service");
const role_enum_1 = require("../shared/role.enum");
let UsersService = class UsersService {
    constructor(usersRepository, authService) {
        this.usersRepository = usersRepository;
        this.authService = authService;
    }
    async create(createUserDto, manager) {
        const repository = manager ? manager.getRepository(user_entity_1.User) : this.usersRepository;
        if (createUserDto.role === role_enum_1.Role.SuperAdmin) {
            throw new common_1.BadRequestException('Cannot create a user with SuperAdmin role via this endpoint.');
        }
        const hashedPassword = await this.authService.hashPassword(createUserDto.password);
        const newUser = repository.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword }));
        const savedUser = await repository.save(newUser);
        const { password } = savedUser, result = __rest(savedUser, ["password"]);
        return result;
    }
    async findOneByEmail(email, selectPassword = false) {
        if (selectPassword) {
            return this.usersRepository.findOne({ where: { email }, select: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isActive', 'emailVerified', 'createdAt', 'updatedAt'] });
        }
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user)
            return null;
        const { password } = user, result = __rest(user, ["password"]);
        return result;
    }
    async findOneById(id, selectSensitiveData = false) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (selectSensitiveData) {
            return user;
        }
        const { password } = user, result = __rest(user, ["password"]);
        return result;
    }
    async findAll() {
        const users = await this.usersRepository.find();
        return users.map(user => {
            const { password } = user, result = __rest(user, ["password"]);
            return result;
        });
    }
    async update(id, updateUserDto) {
        const user = await this.usersRepository.preload(Object.assign({ id }, updateUserDto));
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (updateUserDto.password) {
            user.password = await this.authService.hashPassword(updateUserDto.password);
        }
        const _a = await this.usersRepository.save(user), { password } = _a, result = __rest(_a, ["password"]);
        return result;
    }
    async remove(id) {
        const userToDelete = await this.usersRepository.findOne({ where: { id } });
        if (!userToDelete) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        if (userToDelete.role === role_enum_1.Role.SuperAdmin) {
            throw new common_1.ForbiddenException('Cannot delete SuperAdmin users.');
        }
        await this.usersRepository.delete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        auth_service_1.AuthService])
], UsersService);
//# sourceMappingURL=users.service.js.map