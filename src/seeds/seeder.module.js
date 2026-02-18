"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederModule = void 0;
const common_1 = require("@nestjs/common");
const holidays_module_1 = require("../holidays/holidays.module");
const users_module_1 = require("../users/users.module");
const holiday_seeder_1 = require("./holiday.seeder");
const superadmin_seeder_1 = require("./superadmin.seeder");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = __importDefault(require("../config/database.config"));
const auth_config_1 = __importDefault(require("../config/auth.config"));
const auth_module_1 = require("../auth/auth.module");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt")); // <--- ADD THIS IMPORT
const auth_service_1 = require("../auth/auth.service"); // <--- ADD THIS IMPORT
let SeederModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [database_config_1.default, auth_config_1.default],
                    envFilePath: '.env',
                }),
                typeorm_1.TypeOrmModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => (Object.assign({}, configService.get('database'))),
                }),
                jwt_1.JwtModule.registerAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => __awaiter(void 0, void 0, void 0, function* () {
                        return ({
                            secret: configService.get('JWT_SECRET'),
                            signOptions: { expiresIn: '60m' },
                        });
                    }),
                    inject: [config_1.ConfigService],
                }),
                holidays_module_1.HolidaysModule,
                users_module_1.UsersModule,
                auth_module_1.AuthModule,
            ],
            providers: [
                holiday_seeder_1.HolidaySeeder,
                superadmin_seeder_1.SuperAdminSeeder,
                // Custom provider for AuthService to bypass JwtService dependency during seeding
                {
                    provide: auth_service_1.AuthService,
                    useFactory: () => ({
                        // Only implement hashPassword as it's the only method needed by UsersService for seeding
                        hashPassword: (password) => __awaiter(void 0, void 0, void 0, function* () {
                            const saltRounds = 10;
                            return bcrypt.hash(password, saltRounds);
                        }),
                        // Mock other methods if they were strictly necessary, but for seeding, hashPassword is enough.
                        // For instance: login: () => {}, validateUser: () => {}
                    }),
                },
            ],
            exports: [holiday_seeder_1.HolidaySeeder, superadmin_seeder_1.SuperAdminSeeder],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SeederModule = _classThis = class {
    };
    __setFunctionName(_classThis, "SeederModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SeederModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SeederModule = _classThis;
})();
exports.SeederModule = SeederModule;
