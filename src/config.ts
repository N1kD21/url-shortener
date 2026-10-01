import 'dotenv/config';

/** Runtime configuration, read once from the environment with safe local defaults. */
export const config = {
  port: Number(process.env.PORT) || 3000,
  baseUrl: (process.env.BASE_URL ?? 'http://localhost:3000').replace(
    /\/+$/,
    '',
  ),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
} as const;
