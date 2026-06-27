import { loadJobEnv } from '../src/config/env';
import { runSync } from '../src/jobs/sync-job';

async function main() {
  const env = loadJobEnv();
  const result = await runSync(env);
  console.log(`[sync] status=${result.status} newFollowers=${result.newFollowerCount} unfollows=${result.unfollowCount}`);
  if (result.status === 'failed') process.exit(0);
}

main().catch((err) => { console.error('[sync] Fatal:', err); process.exit(1); });
