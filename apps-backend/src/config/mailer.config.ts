import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('mailer', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    transport: {
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT || '1025', 10),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER || 'user',
        pass: process.env.MAIL_PASSWORD || 'pass',
      },
    },
    defaults: {
      from: process.env.MAIL_FROM || 'noreply@example.com',
    },
    template: {
      dir: join(__dirname, '..', 'templates'),
      adapter: new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
      options: {
        strict: true,
      },
    },
  };
});
