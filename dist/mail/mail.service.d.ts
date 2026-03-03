import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendInvitationEmail(email: string, inviteLink: string): Promise<void>;
    sendMail(to: string, subject: string, template: string, context: any): Promise<void>;
}
