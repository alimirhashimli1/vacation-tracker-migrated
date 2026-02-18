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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const absence_module_1 = require("./absence/absence.module");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = __importDefault(require("./config/database.config"));
const users_module_1 = require("./users/users.module"); // Import UsersModule
const auth_module_1 = require("./auth/auth.module"); // Import AuthModule
const auth_config_1 = __importDefault(require("./config/auth.config")); // Import authConfig
const holidays_module_1 = require("./holidays/holidays.module");
const date_utils_module_1 = require("./utils/date.utils.module");
const invitations_module_1 = require("./invitations/invitations.module");
const schedule_1 = require("@nestjs/schedule"); // Import ScheduleModule
const mailer_1 = require("@nestjs-modules/mailer");
const mailer_config_1 = __importDefault(require("./config/mailer.config"));
const mail_module_1 = require("./mail/mail.module");
const test_controller_1 = require("./test/test.controller"); // <--- NEW IMPORT
let AppModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true, // Make the ConfigService available throughout the app
                    load: [database_config_1.default, auth_config_1.default, mailer_config_1.default], // Load both database, auth and mailer configurations
                    envFilePath: '.env', // Specify the path to the .env file
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
                // Feature Modules
                absence_module_1.AbsenceModule,
                holidays_module_1.HolidaysModule,
                date_utils_module_1.DateUtilsModule,
                mail_module_1.MailModule,
                // Core Modules (moved to the end)
                users_module_1.UsersModule,
                auth_module_1.AuthModule,
                invitations_module_1.InvitationsModule,
            ],
            controllers: [app_controller_1.AppController, test_controller_1.TestController], // <--- ADD TestController
            providers: [app_service_1.AppService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = _classThis = class {
    };
    __setFunctionName(_classThis, "AppModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
})();
exports.AppModule = AppModule;
