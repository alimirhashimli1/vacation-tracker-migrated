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
var SuperAdminSeeder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminSeeder = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const role_enum_1 = require("../shared/role.enum");
const bcrypt = require("bcrypt");
let SuperAdminSeeder = SuperAdminSeeder_1 = class SuperAdminSeeder {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(SuperAdminSeeder_1.name);
    }
    async seed() {
        this.logger.log('Seeding SuperAdmin user...');
        const superAdminEmail = 'alimirhashimli@gmail.com';
        const superAdminPassword = '1Kaybettim.';
        const existingUser = await this.userRepository.findOneBy({ email: superAdminEmail });
        if (existingUser) {
            this.logger.log('SuperAdmin user already exists.');
            if (existingUser.role !== role_enum_1.Role.SuperAdmin) {
                this.logger.log('Updating existing user to be SuperAdmin.');
                await this.userRepository.update(existingUser.id, { role: role_enum_1.Role.SuperAdmin });
            }
        }
        else {
            this.logger.log('Creating new SuperAdmin user.');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);
            const superAdminUser = this.userRepository.create({
                firstName: 'System',
                lastName: 'Admin',
                email: superAdminEmail,
                password: hashedPassword,
                role: role_enum_1.Role.SuperAdmin,
                isActive: true,
                emailVerified: true,
            });
            await this.userRepository.save(superAdminUser);
        }
    }
};
exports.SuperAdminSeeder = SuperAdminSeeder;
exports.SuperAdminSeeder = SuperAdminSeeder = SuperAdminSeeder_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SuperAdminSeeder);
//# sourceMappingURL=superadmin.seeder.js.map