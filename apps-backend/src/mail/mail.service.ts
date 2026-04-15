import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendInvitationEmail(email: string, inviteLink: string) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.error('BREVO_API_KEY is not defined in the configuration.');
      throw new Error('BREVO_API_KEY is missing');
    }

    const subject = 'Invitation to join the platform';
    const senderEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@example.com';
    const senderName = 'Vacation Tracker';

    const data = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: email }],
      subject: subject,
      htmlContent: `
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
      `
    };

    try {
      this.logger.log(`[MailService] Attempting to send API-based email to ${email} via Fetch`);
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Brevo API responded with ${response.status}: ${JSON.stringify(errorBody)}`);
      }

      this.logger.log(`[MailService] Email successfully sent to ${email} via Brevo API (Fetch)`);
    } catch (error: any) {
      this.logger.error(`[MailService] Failed to send email via API to ${email}: ${error.message}`);
      throw new Error(`Invitation created but API email failed: ${error.message}`);
    }
  }
}
