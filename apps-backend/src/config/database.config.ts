import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    // This is the magic line! If URL exists, TypeORM uses it.
    url: process.env.DATABASE_URL, 
    // If URL doesn't exist (like on your local PC), it falls back to these:
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'vacation_db',
    autoLoadEntities: true,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || !isProduction,
    logging: process.env.DATABASE_LOGGING === 'true' || !isProduction,
    // Supabase REQUIRED SSL for cloud connections
    ssl: isProduction || process.env.DATABASE_URL?.includes('supabase') 
      ? { rejectUnauthorized: false } 
      : false,
  };
});