import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ApiEnv } from '../config/env';
import type { JobEnv } from '../config/env';

export function getDb(env: ApiEnv | JobEnv) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

export async function migrate(db: ReturnType<typeof getDb>): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, 'schema.sql'), 'utf-8');
  await db.executeMultiple(sql);
}
