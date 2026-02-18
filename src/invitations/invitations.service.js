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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm"); // Add LessThanOrEqual
const crypto = __importStar(require("crypto"));
const date_fns_1 = require("date-fns");
const bcrypt = __importStar(require("bcrypt"));
const invitations_entity_1 = require("./invitations.entity");
const role_enum_1 = require("../../../../shared/role.enum");
const invitation_status_enum_1 = require("../../../../shared/invitation-status.enum");
const schedule_1 = require("@nestjs/schedule"); // Add Cron
let InvitationsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleCronRemoveExpiredInvitations_decorators;
    var InvitationsService = _classThis = class {
        constructor(invitationsRepository, usersService, mailService, configService) {
            this.invitationsRepository = (__runInitializers(this, _instanceExtraInitializers), invitationsRepository);
            this.usersService = usersService;
            this.mailService = mailService;
            this.configService = configService;
        }
        createInvitation(email, role, invitedById) {
            return __awaiter(this, void 0, void 0, function* () {
                const inviter = yield this.usersService.findOneById(invitedById);
                if (!inviter || (inviter.role !== role_enum_1.Role.Admin && inviter.role !== role_enum_1.Role.SuperAdmin)) {
                    throw new common_1.UnauthorizedException('Only admins and superadmins can create invitations.');
                }
                if (role === role_enum_1.Role.SuperAdmin) {
                    throw new common_1.BadRequestException('Cannot create an invitation for the SuperAdmin role.');
                }
                const existingUser = yield this.usersService.findOneByEmail(email);
                if (existingUser) {
                    throw new common_1.ConflictException('A user with this email already exists.');
                }
                const existingActiveInvitation = yield this.invitationsRepository.findOne({
                    where: {
                        email,
                        status: invitation_status_enum_1.InvitationStatus.PENDING,
                        expiresAt: (0, typeorm_1.MoreThan)(new Date()),
                    },
                });
                if (existingActiveInvitation) {
                    throw new common_1.ConflictException('An active invitation for this email already exists.');
                }
                const plainToken = crypto.randomBytes(32).toString('hex');
                const hashedToken = yield bcrypt.hash(plainToken, 10);
                const expiresAt = (0, date_fns_1.add)(new Date(), { hours: 48 });
                const newInvitation = this.invitationsRepository.create({
                    email,
                    role,
                    token: hashedToken,
                    expiresAt,
                    invitedById,
                });
                const savedInvitation = yield this.invitationsRepository.save(newInvitation);
                console.log(`[AUDIT] Invitation created: By user ID '${savedInvitation.invitedById}' invited '${savedInvitation.email}' (Role: ${savedInvitation.role}) at ${savedInvitation.createdAt.toISOString()}`);
                const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
                const invitationLink = `${frontendUrl}/register?token=${plainToken}`;
                yield this.mailService.sendInvitationEmail(savedInvitation.email, invitationLink);
                return { invitation: savedInvitation, plainToken };
            });
        }
        acceptInvitation(plainToken, password, firstName, lastName) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.invitationsRepository.manager.transaction((transactionalEntityManager) => __awaiter(this, void 0, void 0, function* () {
                    const activeInvitations = yield transactionalEntityManager.find(invitations_entity_1.Invitation, {
                        where: {
                            status: invitation_status_enum_1.InvitationStatus.PENDING,
                            expiresAt: (0, typeorm_1.MoreThan)(new Date()),
                        },
                    });
                    let foundInvitation;
                    for (const invitation of activeInvitations) {
                        const tokenMatch = yield bcrypt.compare(plainToken, invitation.token);
                        if (tokenMatch) {
                            foundInvitation = invitation;
                            break;
                        }
                    }
                    if (!foundInvitation) {
                        throw new common_1.UnauthorizedException('Invalid or expired invitation token.');
                    }
                    // Check if a user with this email already exists
                    const existingUser = yield this.usersService.findOneByEmail(foundInvitation.email);
                    if (existingUser) {
                        throw new common_1.ConflictException('A user with this email already exists.');
                    }
                    foundInvitation.status = invitation_status_enum_1.InvitationStatus.ACCEPTED;
                    foundInvitation.usedAt = new Date();
                    yield transactionalEntityManager.save(foundInvitation);
                    const newUser = yield this.usersService.create({
                        firstName: firstName,
                        lastName: lastName,
                        email: foundInvitation.email,
                        password: password,
                        role: foundInvitation.role,
                        emailVerified: true, // Set to true as the invitation process implies verification
                    }, transactionalEntityManager);
                    return newUser;
                }));
            });
        }
        handleCronRemoveExpiredInvitations() {
            return __awaiter(this, void 0, void 0, function* () {
                const expiredInvitations = yield this.invitationsRepository.find({
                    where: {
                        status: invitation_status_enum_1.InvitationStatus.PENDING,
                        expiresAt: (0, typeorm_1.LessThanOrEqual)(new Date()),
                    },
                });
                if (expiredInvitations.length > 0) {
                    const updatedInvitations = expiredInvitations.map((invitation) => {
                        invitation.status = invitation_status_enum_1.InvitationStatus.EXPIRED;
                        return invitation;
                    });
                    yield this.invitationsRepository.save(updatedInvitations);
                    console.log(`Removed ${updatedInvitations.length} expired invitations.`);
                }
            });
        }
    };
    __setFunctionName(_classThis, "InvitationsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleCronRemoveExpiredInvitations_decorators = [(0, schedule_1.Cron)('0 0 * * *')];
        __esDecorate(_classThis, null, _handleCronRemoveExpiredInvitations_decorators, { kind: "method", name: "handleCronRemoveExpiredInvitations", static: false, private: false, access: { has: obj => "handleCronRemoveExpiredInvitations" in obj, get: obj => obj.handleCronRemoveExpiredInvitations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InvitationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InvitationsService = _classThis;
})();
exports.InvitationsService = InvitationsService;
