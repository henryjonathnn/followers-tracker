import type { Client, InValue } from '@libsql/client';
import type { Member, EventType } from '../domain/types';

export function nowSql(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function parseSqlDate(s: string): Date {
  return new Date(s.replace(' ', 'T') + 'Z');
}

export async function upsertAccount(
  db: Client,
  igUserId: string,
  username: string,
): Promise<{ id: number; igUserId: string; username: string }> {
  await db.execute({
    sql: `INSERT INTO accounts (ig_user_id, username) VALUES (?, ?)
          ON CONFLICT(ig_user_id) DO UPDATE SET username = excluded.username`,
    args: [igUserId, username],
  });
  const row = await db.execute({
    sql: `SELECT id, ig_user_id, username FROM accounts WHERE ig_user_id = ?`,
    args: [igUserId],
  });
  const r = row.rows[0];
  if (!r) throw new Error(`upsertAccount: no row for ig_user_id=${igUserId}`);
  return { id: Number(r['id']), igUserId: String(r['ig_user_id']), username: String(r['username']) };
}

export async function getAccountById(
  db: Client,
  id: number,
): Promise<{ id: number; igUserId: string; username: string } | null> {
  const res = await db.execute({
    sql: `SELECT id, ig_user_id, username FROM accounts WHERE id = ?`,
    args: [id],
  });
  const r = res.rows[0];
  if (!r) return null;
  return { id: Number(r['id']), igUserId: String(r['ig_user_id']), username: String(r['username']) };
}

export async function getSnapshot(
  db: Client,
  accountId: number,
  listType: 'follower' | 'following',
): Promise<Member[]> {
  const res = await db.execute({
    sql: `SELECT member_ig_id, member_username FROM snapshot_members
          WHERE account_id = ? AND list_type = ?`,
    args: [accountId, listType],
  });
  return res.rows.map((r) => ({
    igId: String(r['member_ig_id']),
    username: String(r['member_username']),
  }));
}

export async function replaceSnapshot(
  db: Client,
  accountId: number,
  listType: 'follower' | 'following',
  members: Member[],
  now: string,
): Promise<void> {
  const stmts = [
    {
      sql: `DELETE FROM snapshot_members WHERE account_id = ? AND list_type = ?`,
      args: [accountId, listType] as InValue[],
    },
    ...members.map((m) => ({
      sql: `INSERT INTO snapshot_members
              (account_id, member_ig_id, member_username, list_type, last_seen_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(account_id, member_ig_id, list_type)
            DO UPDATE SET member_username = excluded.member_username,
                          last_seen_at   = excluded.last_seen_at`,
      args: [accountId, m.igId, m.username, listType, now] as InValue[],
    })),
  ];
  await db.batch(stmts, 'write');
}

interface InsertEventsArgs {
  accountId: number;
  jobRunId: number;
  eventType: EventType;
  detectedAt: string;
  members: Array<Member & { wasMutual?: boolean }>;
}

export async function insertEvents(db: Client, args: InsertEventsArgs): Promise<void> {
  if (args.members.length === 0) return;
  const stmts = args.members.map((m) => ({
    sql: `INSERT INTO events
            (account_id, event_type, member_ig_id, member_username,
             member_profile_pic_url, was_mutual, detected_at, job_run_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      args.accountId, args.eventType, m.igId, m.username,
      m.profilePicUrl ?? null,
      args.eventType === 'unfollow' ? (m.wasMutual ? 1 : 0) : 0,
      args.detectedAt, args.jobRunId,
    ] as InValue[],
  }));
  await db.batch(stmts, 'write');
}

export interface EventRow {
  igId: string;
  username: string;
  profilePicUrl: string | null;
  eventType: EventType;
  wasMutual: boolean;
  detectedAt: string;
}

interface ListEventsFilter {
  type?: EventType;
  range?: 'today' | 'week';
  mutual?: boolean;
}

export async function listEvents(
  db: Client,
  accountId: number,
  filter: ListEventsFilter,
): Promise<EventRow[]> {
  const conditions = ['account_id = ?'];
  const args: InValue[] = [accountId];

  if (filter.type) {
    conditions.push('event_type = ?');
    args.push(filter.type);
  }
  if (filter.range === 'today') {
    conditions.push(`detected_at >= datetime('now', '-1 day')`);
  } else if (filter.range === 'week') {
    conditions.push(`detected_at >= datetime('now', '-7 days')`);
    conditions.push(`detected_at < datetime('now', '-1 day')`);
  } else {
    conditions.push(`detected_at >= datetime('now', '-7 days')`);
  }
  if (filter.mutual === true)  { conditions.push('was_mutual = 1'); }
  else if (filter.mutual === false) { conditions.push('was_mutual = 0'); }

  const res = await db.execute({
    sql: `SELECT member_ig_id, member_username, member_profile_pic_url,
                 event_type, was_mutual, detected_at
          FROM events WHERE ${conditions.join(' AND ')}
          ORDER BY detected_at DESC`,
    args,
  });
  return res.rows.map((r) => ({
    igId: String(r['member_ig_id']),
    username: String(r['member_username']),
    profilePicUrl: r['member_profile_pic_url'] != null ? String(r['member_profile_pic_url']) : null,
    eventType: String(r['event_type']) as EventType,
    wasMutual: Number(r['was_mutual']) === 1,
    detectedAt: String(r['detected_at']),
  }));
}

export interface SummaryDTO {
  newToday: number; newWeek: number;
  unfollowToday: number; unfollowWeek: number;
  mutualUnfollowToday: number; mutualUnfollowWeek: number;
}

export async function getSummary(db: Client, accountId: number): Promise<SummaryDTO> {
  const res = await db.execute({
    sql: `SELECT
        COUNT(*) FILTER (WHERE event_type='new_follower' AND detected_at >= datetime('now','-1 day'))                           AS new_today,
        COUNT(*) FILTER (WHERE event_type='new_follower' AND detected_at >= datetime('now','-7 days') AND detected_at < datetime('now','-1 day')) AS new_week,
        COUNT(*) FILTER (WHERE event_type='unfollow'     AND detected_at >= datetime('now','-1 day'))                           AS unfollow_today,
        COUNT(*) FILTER (WHERE event_type='unfollow'     AND detected_at >= datetime('now','-7 days') AND detected_at < datetime('now','-1 day')) AS unfollow_week,
        COUNT(*) FILTER (WHERE event_type='unfollow' AND was_mutual=1 AND detected_at >= datetime('now','-1 day'))              AS mutual_today,
        COUNT(*) FILTER (WHERE event_type='unfollow' AND was_mutual=1 AND detected_at >= datetime('now','-7 days') AND detected_at < datetime('now','-1 day')) AS mutual_week
      FROM events WHERE account_id = ?`,
    args: [accountId],
  });
  const r = res.rows[0] ?? {};
  return {
    newToday:            Number(r['new_today']      ?? 0),
    newWeek:             Number(r['new_week']        ?? 0),
    unfollowToday:       Number(r['unfollow_today']  ?? 0),
    unfollowWeek:        Number(r['unfollow_week']   ?? 0),
    mutualUnfollowToday: Number(r['mutual_today']    ?? 0),
    mutualUnfollowWeek:  Number(r['mutual_week']     ?? 0),
  };
}

export async function createJobRun(db: Client, accountId: number, startedAt: string): Promise<number> {
  const res = await db.execute({
    sql: `INSERT INTO job_runs (account_id, started_at, status) VALUES (?, ?, 'running')`,
    args: [accountId, startedAt],
  });
  return Number(res.lastInsertRowid);
}

interface FinishJobRunArgs {
  status: 'success' | 'failed';
  finishedAt: string;
  followersBefore?: number;
  followersAfter?: number;
  newFollowerCount?: number;
  unfollowCount?: number;
  errorMessage?: string;
}

export async function finishJobRun(db: Client, jobRunId: number, args: FinishJobRunArgs): Promise<void> {
  await db.execute({
    sql: `UPDATE job_runs SET status=?, finished_at=?, followers_before=?,
          followers_after=?, new_follower_count=?, unfollow_count=?, error_message=?
          WHERE id=?`,
    args: [
      args.status, args.finishedAt,
      args.followersBefore ?? null, args.followersAfter ?? null,
      args.newFollowerCount ?? null, args.unfollowCount ?? null,
      args.errorMessage ?? null, jobRunId,
    ],
  });
}

export interface JobRunDTO {
  id: number; accountId: number; startedAt: string; finishedAt: string | null;
  status: 'running' | 'success' | 'failed';
  followersBefore: number | null; followersAfter: number | null;
  newFollowerCount: number | null; unfollowCount: number | null;
  errorMessage: string | null;
}

export async function getLatestJobRun(db: Client, accountId: number): Promise<JobRunDTO | null> {
  const res = await db.execute({
    sql: `SELECT * FROM job_runs WHERE account_id = ? ORDER BY id DESC LIMIT 1`,
    args: [accountId],
  });
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: Number(r['id']), accountId: Number(r['account_id']),
    startedAt: String(r['started_at']),
    finishedAt: r['finished_at'] != null ? String(r['finished_at']) : null,
    status: String(r['status']) as JobRunDTO['status'],
    followersBefore:  r['followers_before']   != null ? Number(r['followers_before'])   : null,
    followersAfter:   r['followers_after']    != null ? Number(r['followers_after'])    : null,
    newFollowerCount: r['new_follower_count'] != null ? Number(r['new_follower_count']) : null,
    unfollowCount:    r['unfollow_count']     != null ? Number(r['unfollow_count'])     : null,
    errorMessage:     r['error_message']      != null ? String(r['error_message'])      : null,
  };
}
