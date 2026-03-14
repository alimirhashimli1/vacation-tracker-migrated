import { registerAs } from '@nestjs/config';

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && defaultValue === undefined) {
    console.warn(`Warning: ${key} is not defined. Mail services may not work.`);
    return '';
  }
  return value || '';
}

export default registerAs('mailer', () => ({
  transport: {
    host: getEnv('SMTP_HOST', 'localhost'),
    port: parseInt(getEnv('SMTP_PORT', '1025'), 10),
    secure: process.env.MAILER_SECURE === 'true',
    auth: {
      user: getEnv('SMTP_USER', 'user'),
      pass: getEnv('SMTP_PASSWORD', 'pass'),
    },
  },
  defaults: {
    from: getEnv('SMTP_FROM', 'noreply@example.com'),
  },
  template: {
    dir: process.cwd() + '/src/templates',
    adapter: new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
    options: {
      strict: true,
    },
  },
}));
