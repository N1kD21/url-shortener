import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Runs once before the e2e suite: points the app at a throwaway SQLite file
 * and applies the real migrations to it, so tests exercise the same schema
 * as production.
 */
export default function globalSetup() {
  rmSync(join(__dirname, '..', 'test.db'), { force: true });
  // Relative URL (resolved from the project root by both Prisma CLI and the
  // runtime adapter) so it works the same on Windows, macOS and Linux.
  process.env.DATABASE_URL = 'file:./test.db';
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
