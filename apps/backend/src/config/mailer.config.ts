import { registerAs } from '@nestjs/config';

export default registerAs('mailer', () => ({
  transport: {
    host: process.env.MAILER_HOST || 'smtp.example.com',
    port: parseInt(process.env.MAILER_PORT || '587', 10),
    secure: process.env.MAILER_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASSWORD,
    },
  },
  defaults: {
    from: '"No Reply" <no-reply@example.com>',
  },
  template: {
    dir: process.cwd() + '/apps/backend/src/templates',
    adapter: new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
    options: {
      strict: true,
    },
  },
}));
