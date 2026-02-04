import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendInvitationEmail(email: string, inviteLink: string) {
    await this.sendMail(
      email,
      'Invitation to join the platform',
      'invitation', // Corresponds to invitation.hbs
      { inviteLink },
    );
  }

  async sendMail(to: string, subject: string, template: string, context: any) {
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
