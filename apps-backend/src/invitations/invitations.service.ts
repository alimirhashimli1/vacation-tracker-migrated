import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository, LessThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import { add } from 'date-fns';
import { Invitation } from './invitations.entity';
import { Role } from '../shared/role.enum';
import { UsersService } from '../users/users.service';
import { InvitationStatus } from '../shared/invitation-status.enum';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private usersService: UsersService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async createInvitation(
    email: string,
    role: Role,
    invitedById: string,
  ): Promise<{ invitation: Invitation; plainToken: string }> {
    const inviter = await this.usersService.findOneById(invitedById);
    if (!inviter || (inviter.role !== Role.Admin && inviter.role !== Role.SuperAdmin)) {
      throw new UnauthorizedException('Only admins and superadmins can create invitations.');
    }

    if (role === Role.SuperAdmin) {
      throw new BadRequestException('Cannot create an invitation for the SuperAdmin role.');
    }

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const existingInvitation = await this.invitationsRepository.findOne({
      where: { email },
    });

    const plainToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = add(new Date(), { hours: 48 });

    let savedInvitation: Invitation;

    if (existingInvitation) {
      existingInvitation.token = plainToken;
      existingInvitation.expiresAt = expiresAt;
      existingInvitation.invitedById = invitedById;
      existingInvitation.status = InvitationStatus.PENDING;
      existingInvitation.role = role;
      savedInvitation = await this.invitationsRepository.save(existingInvitation);
      console.log(`[AUDIT] Invitation resent for ${email}`);
    } else {
      const newInvitation = this.invitationsRepository.create({
        email,
        role,
        token: plainToken,
        expiresAt,
        invitedById,
        status: InvitationStatus.PENDING,
      });

      savedInvitation = await this.invitationsRepository.save(newInvitation);
      console.log(`[AUDIT] Invitation created for ${email}`);
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/register?token=${plainToken}`;
    
    try {
      await this.mailService.sendInvitationEmail(savedInvitation.email, invitationLink);
    } catch (error) {
      console.error(`Failed to send invitation email: ${error.message}`);
      throw new Error(`Invitation created but email failed: ${error.message}`);
    }

    return { invitation: savedInvitation, plainToken };
  }

  async verifyInvitationToken(token: string): Promise<{ email: string; role: Role }> {
    const trimmedToken = token.trim();
    const now = new Date();
    
    console.log('--- Invitation Verification Debug ---');
    console.log(`Received Token: "${trimmedToken}"`);
    console.log(`Token Length: ${trimmedToken.length}`);
    console.log(`Current Server Time: ${now.toISOString()}`);

    const invitation = await this.invitationsRepository.findOne({
      where: {
        token: trimmedToken,
      },
    });

    if (!invitation) {
      console.warn(`[DEBUG] No invitation found in DB with token: "${trimmedToken}"`);
      // Let's see what IS in the DB
      const allInvitations = await this.invitationsRepository.find({ take: 5 });
      console.log(`[DEBUG] Sample of tokens in DB:`, allInvitations.map(i => `"${i.token}" (${i.status})`));
      throw new UnauthorizedException('Invalid invitation token.');
    }

    console.log(`[DEBUG] Found Invitation: ${invitation.email}`);
    console.log(`[DEBUG] Status: ${invitation.status}`);
    console.log(`[DEBUG] Expires At: ${invitation.expiresAt.toISOString()}`);

    if (invitation.status !== InvitationStatus.PENDING) {
      console.warn(`[DEBUG] Invitation is NOT PENDING. Status is: ${invitation.status}`);
      throw new UnauthorizedException('Invitation has already been used or cancelled.');
    }

    if (invitation.expiresAt < now) {
      console.warn(`[DEBUG] Invitation is EXPIRED. Diff: ${now.getTime() - invitation.expiresAt.getTime()}ms`);
      throw new UnauthorizedException('Invitation has expired.');
    }

    console.log('[DEBUG] Verification SUCCESS');
    console.log('-------------------------------------');
    return { email: invitation.email, role: invitation.role };
  }

  async acceptInvitation(
    token: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    return await this.invitationsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const invitation = await transactionalEntityManager.findOne(Invitation, {
          where: {
            token: token.trim(),
            status: InvitationStatus.PENDING,
          },
        });

        if (!invitation || invitation.expiresAt < new Date()) {
          throw new UnauthorizedException('Invalid or expired invitation token.');
        }

        const existingUser = await this.usersService.findOneByEmail(invitation.email);
        if (existingUser) {
          throw new ConflictException('User already exists.');
        }

        invitation.status = InvitationStatus.ACCEPTED;
        invitation.usedAt = new Date();
        await transactionalEntityManager.save(invitation);

        // Service handles password hashing
        const newUser = await this.usersService.create(
          {
            firstName,
            lastName,
            email: invitation.email,
            password,
            role: invitation.role,
            emailVerified: true,
          },
          transactionalEntityManager,
        ) as User;

        return newUser;
      },
    );
  }

  @Cron('0 0 * * *')
  async handleCronRemoveExpiredInvitations() {
    const expiredInvitations = await this.invitationsRepository.find({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: LessThanOrEqual(new Date()),
      },
    });

    if (expiredInvitations.length > 0) {
      expiredInvitations.forEach(inv => inv.status = InvitationStatus.EXPIRED);
      await this.invitationsRepository.save(expiredInvitations);
    }
  }
}
