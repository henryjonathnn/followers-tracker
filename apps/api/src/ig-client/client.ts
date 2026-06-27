import type { Member } from '../domain/types';

const BASE = 'https://i.instagram.com/api/v1';

const IG_HEADERS = {
  'User-Agent':            'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
  'X-IG-App-ID':           '936619743392459',
  'X-IG-Capabilities':     '3brTvw==',
  'X-IG-Connection-Type':  'WIFI',
  'X-IG-Connection-Speed': '3700kbps',
  'Accept-Language':       'en-US',
  'Accept-Encoding':       'gzip, deflate',
  'Accept':                '*/*',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => sleep(3000 + Math.random() * 2000);

interface IgClientOptions { sessionId: string }

export class IgAuthError extends Error {
  constructor(msg: string) { super(msg); this.name = 'IgAuthError'; }
}

async function igFetch(path: string, sessionId: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // 15 detik

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        ...IG_HEADERS,
        Cookie: `sessionid=${sessionId}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log(`[ig] ${path} -> HTTP ${res.status}`);

    if (res.status === 401 || res.status === 403) throw new IgAuthError(`HTTP ${res.status}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`IG API error: HTTP ${res.status} on ${path} — ${body.slice(0, 200)}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`[ig] Timeout after 15s on ${path}`);
    }
    throw err;
  }
}

export async function getCurrentUser(opts: IgClientOptions): Promise<{ igUserId: string; username: string }> {
  const data = await igFetch('/accounts/current_user/?edit=true', opts.sessionId) as {
    user?: { pk: string; username: string }
  };
  if (!data.user) throw new Error('getCurrentUser: unexpected response');
  return { igUserId: String(data.user.pk), username: data.user.username };
}

async function fetchList(opts: IgClientOptions, userId: string, endpoint: 'followers' | 'following'): Promise<Member[]> {
  const members: Member[] = [];
  let nextMaxId: string | null = null;
  do {
    const qs = nextMaxId ? `?max_id=${encodeURIComponent(nextMaxId)}` : '';
    const data = await igFetch(`/friendships/${userId}/${endpoint}/${qs}`, opts.sessionId) as {
      users?: Array<{ pk: string; username: string; profile_pic_url?: string }>;
      next_max_id?: string;
    };
    if (!data.users) break;
    for (const u of data.users) {
      members.push({ igId: String(u.pk), username: u.username, profilePicUrl: u.profile_pic_url });
    }
    nextMaxId = data.next_max_id ?? null;
    if (nextMaxId) await randomDelay();
  } while (nextMaxId);
  return members;
}

export const fetchFollowers = (opts: IgClientOptions, userId: string) => fetchList(opts, userId, 'followers');
export const fetchFollowing = (opts: IgClientOptions, userId: string) => fetchList(opts, userId, 'following');