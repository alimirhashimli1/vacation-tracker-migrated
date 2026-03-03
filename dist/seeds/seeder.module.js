"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederModule = void 0;
const common_1 = require("@nestjs/common");
const absence_module_1 = require("../absence/absence.module");
const holidays_module_1 = require("../holidays/holidays.module");
const users_module_1 = require("../users/users.module");
const holiday_seeder_1 = require("./holiday.seeder");
const superadmin_seeder_1 = require("./superadmin.seeder");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = require("../config/database.config");
const auth_config_1 = require("../config/auth.config");
const mailer_config_1 = require("../config/mailer.config");
const mailer_1 = require("@nestjs-modules/mailer");
const auth_module_1 = require("../auth/auth.module");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const auth_service_1 = require("../auth/auth.service");
const user_entity_1 = require("../users/user.entity");
let SeederModule = class SeederModule {
};
exports.SeederModule = SeederModule;
exports.SeederModule = SeederModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, auth_config_1.default, mailer_config_1.default],
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (Object.assign({}, configService.get('database'))),
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User]),
            mailer_1.MailerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (Object.assign({}, configService.get('mailer'))),
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: '60m' },
                }),
                inject: [config_1.ConfigService],
            }),
            holidays_module_1.HolidaysModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            absence_module_1.AbsenceModule,
        ],
        providers: [
            holiday_seeder_1.HolidaySeeder,
            superadmin_seeder_1.SuperAdminSeeder,
            {
                provide: auth_service_1.AuthService,
                useFactory: () => ({
                    hashPassword: async (password) => {
                        const saltRounds = 10;
                        return bcrypt.hash(password, saltRounds);
                    },
                }),
            },
        ],
        exports: [holiday_seeder_1.HolidaySeeder, superadmin_seeder_1.SuperAdminSeeder],
    })
], SeederModule);
//# sourceMappingURL=seeder.module.js.map