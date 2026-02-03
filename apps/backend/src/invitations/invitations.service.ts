import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { add } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { Invitation } from './invitations.entity';
import { Role } from '../../../../shared/role.enum';
import { UsersService } from '../users/users.service';
import { InvitationStatus } from '../../../../shared/invitation-status.enum';
import { User } from '../users/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private usersService: UsersService,
    private mailerService: MailerService,
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

    await this.sendInvitationEmail(savedInvitation.email, plainToken);

    return { invitation: savedInvitation, plainToken };
  }

  async acceptInvitation(plainToken: string, password: string): Promise<User> {
    const activeInvitations = await this.invitationsRepository.find({
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

    foundInvitation.status = InvitationStatus.ACCEPTED;
    foundInvitation.usedAt = new Date();
    await this.invitationsRepository.save(foundInvitation);

    const newUser = await this.usersService.create({
      firstName: 'Invited',
      lastName: 'User',
      email: foundInvitation.email,
      password: password,
      role: foundInvitation.role,
    });

    return newUser;
  }

  private async sendInvitationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'You are invited to join our application!',
        template: 'invitation', // This refers to invitation.hbs in your templates directory
        context: {
          invitationLink,
        },
      });
      console.log(`Invitation email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send invitation email to ${email}:`, error);
      // Depending on requirements, you might want to re-throw or handle this error differently
    }
  }
}
