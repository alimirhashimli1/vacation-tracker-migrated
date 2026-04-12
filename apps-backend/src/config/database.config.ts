import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'vacation_db',
    autoLoadEntities: true,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || (!isProduction && true), // Default to true ONLY in non-production
    logging: process.env.DATABASE_LOGGING === 'true' || !isProduction,
  };
});