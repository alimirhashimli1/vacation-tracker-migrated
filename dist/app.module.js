"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const absence_module_1 = require("./absence/absence.module");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = require("./config/database.config");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const auth_config_1 = require("./config/auth.config");
const holidays_module_1 = require("./holidays/holidays.module");
const date_utils_module_1 = require("./utils/date.utils.module");
const invitations_module_1 = require("./invitations/invitations.module");
const schedule_1 = require("@nestjs/schedule");
const mailer_1 = require("@nestjs-modules/mailer");
const mailer_config_1 = require("./config/mailer.config");
const mail_module_1 = require("./mail/mail.module");
const test_controller_1 = require("./test/test.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
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
            mailer_1.MailerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (Object.assign({}, configService.get('mailer'))),
            }),
            schedule_1.ScheduleModule.forRoot(),
            absence_module_1.AbsenceModule,
            holidays_module_1.HolidaysModule,
            date_utils_module_1.DateUtilsModule,
            mail_module_1.MailModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            invitations_module_1.InvitationsModule,
        ],
        controllers: [app_controller_1.AppController, test_controller_1.TestController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map