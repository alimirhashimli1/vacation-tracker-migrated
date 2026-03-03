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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const date_fns_1 = require("date-fns");
const bcrypt = require("bcrypt");
const invitations_entity_1 = require("./invitations.entity");
const role_enum_1 = require("../shared/role.enum");
const users_service_1 = require("../users/users.service");
const invitation_status_enum_1 = require("../shared/invitation-status.enum");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
const schedule_1 = require("@nestjs/schedule");
let InvitationsService = class InvitationsService {
    constructor(invitationsRepository, usersService, mailService, configService) {
        this.invitationsRepository = invitationsRepository;
        this.usersService = usersService;
        this.mailService = mailService;
        this.configService = configService;
    }
    async createInvitation(email, role, invitedById) {
        const inviter = await this.usersService.findOneById(invitedById);
        if (!inviter || (inviter.role !== role_enum_1.Role.Admin && inviter.role !== role_enum_1.Role.SuperAdmin)) {
            throw new common_1.UnauthorizedException('Only admins and superadmins can create invitations.');
        }
        if (role === role_enum_1.Role.SuperAdmin) {
            throw new common_1.BadRequestException('Cannot create an invitation for the SuperAdmin role.');
        }
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const existingActiveInvitation = await this.invitationsRepository.findOne({
            where: {
                email,
                status: invitation_status_enum_1.InvitationStatus.PENDING,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (existingActiveInvitation) {
            throw new common_1.ConflictException('An active invitation for this email already exists.');
        }
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(plainToken, 10);
        const expiresAt = (0, date_fns_1.add)(new Date(), { hours: 48 });
        const newInvitation = this.invitationsRepository.create({
            email,
            role,
            token: hashedToken,
            expiresAt,
            invitedById,
        });
        const savedInvitation = await this.invitationsRepository.save(newInvitation);
        console.log(`[AUDIT] Invitation created: By user ID '${savedInvitation.invitedById}' invited '${savedInvitation.email}' (Role: ${savedInvitation.role}) at ${savedInvitation.createdAt.toISOString()}`);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const invitationLink = `${frontendUrl}/register?token=${plainToken}`;
        await this.mailService.sendInvitationEmail(savedInvitation.email, invitationLink);
        return { invitation: savedInvitation, plainToken };
    }
    async acceptInvitation(plainToken, password, firstName, lastName) {
        return await this.invitationsRepository.manager.transaction(async (transactionalEntityManager) => {
            const activeInvitations = await transactionalEntityManager.find(invitations_entity_1.Invitation, {
                where: {
                    status: invitation_status_enum_1.InvitationStatus.PENDING,
                    expiresAt: (0, typeorm_2.MoreThan)(new Date()),
                },
            });
            let foundInvitation;
            for (const invitation of activeInvitations) {
                const tokenMatch = await bcrypt.compare(plainToken, invitation.token);
                if (tokenMatch) {
                    foundInvitation = invitation;
                    break;
                }
            }
            if (!foundInvitation) {
                throw new common_1.UnauthorizedException('Invalid or expired invitation token.');
            }
            const existingUser = await this.usersService.findOneByEmail(foundInvitation.email);
            if (existingUser) {
                throw new common_1.ConflictException('A user with this email already exists.');
            }
            foundInvitation.status = invitation_status_enum_1.InvitationStatus.ACCEPTED;
            foundInvitation.usedAt = new Date();
            await transactionalEntityManager.save(foundInvitation);
            const newUser = await this.usersService.create({
                firstName: firstName,
                lastName: lastName,
                email: foundInvitation.email,
                password: password,
                role: foundInvitation.role,
                emailVerified: true,
            }, transactionalEntityManager);
            return newUser;
        });
    }
    async handleCronRemoveExpiredInvitations() {
        const expiredInvitations = await this.invitationsRepository.find({
            where: {
                status: invitation_status_enum_1.InvitationStatus.PENDING,
                expiresAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
        });
        if (expiredInvitations.length > 0) {
            const updatedInvitations = expiredInvitations.map((invitation) => {
                invitation.status = invitation_status_enum_1.InvitationStatus.EXPIRED;
                return invitation;
            });
            await this.invitationsRepository.save(updatedInvitations);
            console.log(`Removed ${updatedInvitations.length} expired invitations.`);
        }
    }
};
exports.InvitationsService = InvitationsService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvitationsService.prototype, "handleCronRemoveExpiredInvitations", null);
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invitations_entity_1.Invitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        mail_service_1.MailService,
        config_1.ConfigService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map