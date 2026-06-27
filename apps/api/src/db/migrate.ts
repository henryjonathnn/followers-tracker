import { loadJobEnv } from '../config/env';
import { getDb, migrate } from './client';

async function main() {
  const env = loadJobEnv();
  const db = getDb(env);
  await migrate(db);
  console.log('[migrate] schema applied successfully.');
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
