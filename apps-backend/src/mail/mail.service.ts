import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const SibApiV3Sdk = require('@getbrevo/brevo');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private apiInstance: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY is not defined in the configuration.');
    }
    
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey || '');
  }

  async sendInvitationEmail(email: string, inviteLink: string) {
    const subject = 'Invitation to join the platform';
    const senderEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@example.com';
    const senderName = 'Vacation Tracker';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invitation to Join</title>
        </head>
        <body>
            <h1>You are invited to join our application!</h1>
            <p>Please click the link below to accept your invitation and set up your account:</p>
            <p><a href="${inviteLink}">Accept Invitation</a></p>
            <p>If you have any questions, please contact our support team.</p>
        </body>
        </html>
      `;

    try {
      this.logger.log(`[MailService] Attempting to send API-based email to ${email}`);
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`[MailService] Email successfully sent to ${email} via Brevo API`);
    } catch (error: any) {
      this.logger.error(`[MailService] Failed to send email via API to ${email}: ${error.message}`);
      if (error.response && error.response.body) {
        this.logger.error(`[Brevo API Error Details]: ${JSON.stringify(error.response.body)}`);
      }
      throw new Error(`Invitation created but API email failed: ${error.message}`);
    }
  }
}
