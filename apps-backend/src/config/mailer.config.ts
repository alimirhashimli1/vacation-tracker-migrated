import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('mailer', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use the absolute path for templates in the Docker container
  const templateDir = isProduction 
    ? '/app/apps-backend/dist/templates' 
    : join(process.cwd(), 'src', 'templates');

  return {
    transport: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASSWORD || 'pass',
      },
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
