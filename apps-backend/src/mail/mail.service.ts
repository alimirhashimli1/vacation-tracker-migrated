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
      { invitationLink: inviteLink },
    );
  }

  async sendMail(to: string, subject: string, template: string, context: any) {
    console.log(`[MailService] Attempting to send email to ${to} with subject: ${subject}`);
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      console.log(`[MailService] Email successfully sent to ${to}`);
    } catch (error) {
      console.error(`[MailService] Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }
}
