import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  return {
    jwtSecret: jwtSecret || 'super-secret-key-change-me-in-development',
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  };
});
