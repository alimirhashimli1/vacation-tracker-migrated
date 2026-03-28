import { registerAs } from '@nestjs/config';
import { join } from 'path';

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && defaultValue === undefined) {
    console.warn(`Warning: ${key} is not defined. Mail services may not work.`);
    return '';
  }
  return value || '';
}

export default registerAs('mailer', () => {
  const host = getEnv('SMTP_HOST', 'localhost');
  const port = parseInt(getEnv('SMTP_PORT', '1025'), 10);
  const user = getEnv('SMTP_USER', 'user');
  const from = getEnv('SMTP_FROM', 'noreply@example.com');
  const secure = process.env.MAILER_SECURE === 'true';
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_KEY || 'pass';

  console.log('--- Mailer Configuration Loaded ---');
  console.log(`SMTP Host: ${host}`);
  console.log(`SMTP Port: ${port}`);
  console.log(`SMTP User: ${user}`);
  console.log(`SMTP From: ${from}`);
  console.log(`SMTP Password length: ${pass.length}`);
  console.log(`SMTP Password starts with: ${pass.substring(0, 8)}...`);
  console.log('-----------------------------------');

  return {
    transport: {
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    },
    defaults: {
      from,
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
