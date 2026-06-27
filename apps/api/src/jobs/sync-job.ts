import type { JobEnv } from '../config/env';
import { getDb, migrate } from '../db/client';
import {
  upsertAccount, getSnapshot, replaceSnapshot, insertEvents,
  createJobRun, finishJobRun, nowSql,
} from '../db/repository';
import { diffSnapshots } from '../domain/diff';
import { getCurrentUser, fetchFollowers, fetchFollowing, IgAuthError } from '../ig-client/client';

export interface SyncResult {
  status: 'success' | 'failed';
  accountId: number;
  newFollowerCount: number;
  unfollowCount: number;
  errorMessage?: string;
}

export async function runSync(env: JobEnv): Promise<SyncResult> {
  const db = getDb(env);
  await migrate(db);

  const igOpts = { sessionId: env.IG_SESSION_ID };
  let accountId = 0;
  let jobRunId  = 0;

  try {
    const { igUserId, username } = await getCurrentUser(igOpts);
    const account = await upsertAccount(db, igUserId, username);
    accountId = account.id;
    jobRunId  = await createJobRun(db, accountId, nowSql());

    const prevFollowers = await getSnapshot(db, accountId, 'follower');
    const [currFollowers, currFollowing] = await Promise.all([
      fetchFollowers(igOpts, igUserId),
      fetchFollowing(igOpts, igUserId),
    ]);

    const { newFollowers, unfollowers } = diffSnapshots(prevFollowers, currFollowers, currFollowing);
    const detectedAt = nowSql();

    await insertEvents(db, { accountId, jobRunId, eventType: 'new_follower', detectedAt, members: newFollowers });
    await insertEvents(db, { accountId, jobRunId, eventType: 'unfollow',     detectedAt, members: unfollowers });
    await replaceSnapshot(db, accountId, 'follower',  currFollowers, detectedAt);
    await replaceSnapshot(db, accountId, 'following', currFollowing, detectedAt);

    await finishJobRun(db, jobRunId, {
      status: 'success', finishedAt: nowSql(),
      followersBefore: prevFollowers.length, followersAfter: currFollowers.length,
      newFollowerCount: newFollowers.length, unfollowCount: unfollowers.length,
    });

    return { status: 'success', accountId, newFollowerCount: newFollowers.length, unfollowCount: unfollowers.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jobRunId) await finishJobRun(db, jobRunId, { status: 'failed', finishedAt: nowSql(), errorMessage: msg }).catch(() => {});
    if (err instanceof IgAuthError) {
      console.error('[sync] IG auth error:', msg);
      return { status: 'failed', accountId, newFollowerCount: 0, unfollowCount: 0, errorMessage: msg };
    }
    throw err;
  }
}
