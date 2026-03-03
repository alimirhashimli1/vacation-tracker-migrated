import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres', // OR process.env.DATABASE_TYPE (must be one of the supported drivers)
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vacation_db',
  autoLoadEntities: true, // Highly recommended for seeding/NestJS setups
  synchronize: true,      // Only for development!
}));