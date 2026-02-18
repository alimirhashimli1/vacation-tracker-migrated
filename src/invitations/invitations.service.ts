import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository, LessThanOrEqual } from 'typeorm'; // Add LessThanOrEqual
import * as crypto from 'crypto';
import { add } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { Invitation } from './invitations.entity';
import { Role } from '../shared/role.enum';
import { UsersService } from '../users/users.service';
import { InvitationStatus } from '../shared/invitation-status.enum';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Cron } from '@nestjs/schedule'; // Add Cron

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

    const existingActiveInvitation = await this.invitationsRepository.findOne({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (existingActiveInvitation) {
      throw new ConflictException('An active invitation for this email already exists.');
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expiresAt = add(new Date(), { hours: 48 });

    const newInvitation = this.invitationsRepository.create({
      email,
      role,
      token: hashedToken,
      expiresAt,
      invitedById,
    });

    const savedInvitation = await this.invitationsRepository.save(newInvitation);
    console.log(
      `[AUDIT] Invitation created: By user ID '${savedInvitation.invitedById}' invited '${savedInvitation.email}' (Role: ${savedInvitation.role}) at ${savedInvitation.createdAt.toISOString()}`,
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/register?token=${plainToken}`;
    await this.mailService.sendInvitationEmail(savedInvitation.email, invitationLink);

    return { invitation: savedInvitation, plainToken };
  }

  async acceptInvitation(
    plainToken: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    return await this.invitationsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const activeInvitations = await transactionalEntityManager.find(Invitation, {
          where: {
            status: InvitationStatus.PENDING,
            expiresAt: MoreThan(new Date()),
          },
        });

        let foundInvitation: Invitation | undefined;
        for (const invitation of activeInvitations) {
          const tokenMatch = await bcrypt.compare(plainToken, invitation.token);
          if (tokenMatch) {
            foundInvitation = invitation;
            break;
          }
        }

        if (!foundInvitation) {
          throw new UnauthorizedException('Invalid or expired invitation token.');
        }

        // Check if a user with this email already exists
        const existingUser = await this.usersService.findOneByEmail(foundInvitation.email);
        if (existingUser) {
          throw new ConflictException('A user with this email already exists.');
        }

        foundInvitation.status = InvitationStatus.ACCEPTED;
        foundInvitation.usedAt = new Date();
        await transactionalEntityManager.save(foundInvitation);

        const newUser = await this.usersService.create(
          {
            firstName: firstName,
            lastName: lastName,
            email: foundInvitation.email,
            password: password,
            role: foundInvitation.role,
            isVerified: true, // Set to true as the invitation process implies verification
          },
          transactionalEntityManager,
        );

        return newUser;
      },
    );
  }

  @Cron('0 0 * * *') // Runs daily at midnight
  async handleCronRemoveExpiredInvitations() {
    const expiredInvitations = await this.invitationsRepository.find({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: LessThanOrEqual(new Date()),
      },
    });

    if (expiredInvitations.length > 0) {
      const updatedInvitations = expiredInvitations.map((invitation) => {
        invitation.status = InvitationStatus.EXPIRED;
        return invitation;
      });
      await this.invitationsRepository.save(updatedInvitations);
      console.log(`Removed ${updatedInvitations.length} expired invitations.`);
    }
  }
}
