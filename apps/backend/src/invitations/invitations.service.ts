import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm'; // Import MoreThan
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import * as bcrypt from 'bcrypt'; // Import bcrypt
import { Invitation } from './invitations.entity';
import { Role } from '../../../../shared/role.enum';
import { UsersService } from '../users/users.service';
import { InvitationStatus } from '../../../../shared/invitation-status.enum'; // Import InvitationStatus
import { User } from '../users/user.entity'; // Import User entity
import { CreateUserDto } from '../../../../shared/user.dto'; // Import CreateUserDto

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private usersService: UsersService,
  ) {}

  async createInvitation(email: string, role: Role, invitedById: string): Promise<{ invitation: Invitation, plainToken: string }> {
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


    const plainToken = uuidv4();
    const hashedToken = await bcrypt.hash(plainToken, 10); // Hash the token
    const expiresAt = add(new Date(), { hours: 48 }); // Invitation expires in 48 hours

    const newInvitation = this.invitationsRepository.create({
      email,
      role,
      token: hashedToken, // Store hashed token
      expiresAt,
      invitedById, // Save the inviter's ID
    });

    const savedInvitation = await this.invitationsRepository.save(newInvitation);

    // TODO: Send email with invitation link (using plainToken)

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

    // Mark invitation as accepted
    foundInvitation.status = InvitationStatus.ACCEPTED;
    foundInvitation.usedAt = new Date();
    await this.invitationsRepository.save(foundInvitation);

    // Create the user
    const newUserDto: CreateUserDto = {
      firstName: 'Invited', // Placeholder, user will update after login
      lastName: 'User', // Placeholder
      email: foundInvitation.email,
      password: password,
      role: foundInvitation.role,
    };
    const newUser = await this.usersService.create(newUserDto);

    return newUser;
  }
}
