import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import type { ApiEnv } from '../config/env';
import { getDb, migrate } from '../db/client';
import { getAccountById, getLatestJobRun, getSummary, listEvents, parseSqlDate } from '../db/repository';
import { getBucket } from '../domain/bucket';

const accountParams = t.Object({ accountId: t.Numeric() });

export function createApp(env: ApiEnv) {
  const db = getDb(env);
  let migratedOnce: Promise<void> | null = null;
  const ensureMigrated = () => (migratedOnce ??= migrate(db));

  return new Elysia()
    .use(cors({ origin: env.CORS_ORIGIN }))
    .onBeforeHandle(() => ensureMigrated())
    .get('/accounts/:accountId', async ({ params, status }) => {
  const account = await getAccountById(db, params.accountId);
  if (!account) return status(404, { error: 'Account not found' });
  return account;
}, { params: accountParams })
    .get('/accounts/:accountId/events', async ({ params, query, status }) => {
      const account = await getAccountById(db, params.accountId);
      if (!account) return status(404, { error: 'Account not found' });
      const rows = await listEvents(db, account.id, { type: query.type, range: query.range, mutual: query.mutual });
      const data = rows.map((row) => ({
        igId: row.igId, username: row.username, profilePicUrl: row.profilePicUrl,
        eventType: row.eventType, wasMutual: row.wasMutual, detectedAt: row.detectedAt,
        bucket: getBucket(parseSqlDate(row.detectedAt)),
      }));
      return { data, meta: { count: data.length } };
    }, {
      params: accountParams,
      query: t.Object({
        type: t.Optional(t.Union([t.Literal('new_follower'), t.Literal('unfollow')])),
        range: t.Optional(t.Union([t.Literal('today'), t.Literal('week')])),
        mutual: t.Optional(t.Boolean()),
      }),
    })
    .get('/accounts/:accountId/summary', async ({ params, status }) => {
      const account = await getAccountById(db, params.accountId);
      if (!account) return status(404, { error: 'Account not found' });
      return getSummary(db, account.id);
    }, { params: accountParams })
    .get('/accounts/:accountId/jobs/latest', async ({ params, status }) => {
      const account = await getAccountById(db, params.accountId);
      if (!account) return status(404, { error: 'Account not found' });
      const job = await getLatestJobRun(db, account.id);
      if (!job) return status(404, { error: 'No job runs yet' });
      return job;
    }, { params: accountParams });
}

export type App = ReturnType<typeof createApp>;
