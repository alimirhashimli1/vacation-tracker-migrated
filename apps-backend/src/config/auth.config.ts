import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
}));
