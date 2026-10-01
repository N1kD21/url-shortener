import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Runs once before the e2e suite: points the app at a throwaway SQLite file
 * and applies the real migrations to it, so tests exercise the same schema
 * as production.
 */
export default function globalSetup() {
  const dbFile = join(__dirname, '..', 'test.db');
  rmSync(dbFile, { force: true });
  process.env.DATABASE_URL = `file:${dbFile}`;
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
