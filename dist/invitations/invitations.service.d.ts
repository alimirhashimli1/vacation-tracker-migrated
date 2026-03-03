import { Repository } from 'typeorm';
import { Invitation } from './invitations.entity';
import { Role } from '../shared/role.enum';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
export declare class InvitationsService {
    private invitationsRepository;
    private usersService;
    private mailService;
    private configService;
    constructor(invitationsRepository: Repository<Invitation>, usersService: UsersService, mailService: MailService, configService: ConfigService);
    createInvitation(email: string, role: Role, invitedById: string): Promise<{
        invitation: Invitation;
        plainToken: string;
    }>;
    acceptInvitation(plainToken: string, password: string, firstName: string, lastName: string): Promise<User>;
    handleCronRemoveExpiredInvitations(): Promise<void>;
}
