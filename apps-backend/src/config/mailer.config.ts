import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('mailer', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use the absolute path for templates in the Docker container
  const templateDir = isProduction 
    ? '/app/apps-backend/dist/templates' 
    : join(process.cwd(), 'apps-backend', 'src', 'templates');

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.MAILER_SECURE === 'true';

  console.log(`[MailerConfig] Initializing with Host: ${host}, Port: ${port}, Secure: ${secure}`);

  return {
    transport: {
      host: host || 'localhost',
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASSWORD || 'pass',
      },
      tls: {
        // This is often needed for cloud-to-cloud connections
        rejectUnauthorized: false,
      },
      // Increase timeout for slow connections
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    },
    defaults: {
      from: process.env.SMTP_FROM || '"Vacation Tracker" <noreply@example.com>',
    },
    template: {
      dir: templateDir,
      adapter: new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
      options: {
        strict: true,
      },
    },
  };
});
