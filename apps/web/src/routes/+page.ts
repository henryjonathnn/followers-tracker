import type { PageLoad } from './$types';
import { createApiClient } from '$lib/api-client';

const ACCOUNT_ID = 1;

export const load: PageLoad = async ({ url, fetch }) => {
  const range     = url.searchParams.get('range') === 'week' ? 'week' : 'today';
  const typeParam = url.searchParams.get('type');
  const type      = typeParam === 'new_follower' || typeParam === 'unfollow' ? typeParam : undefined;
  const mutual    = url.searchParams.get('mutual') === 'true' ? true : undefined;

  const api     = createApiClient(fetch);
  const account = api.accounts({ accountId: ACCOUNT_ID });

  const [accountRes, summaryRes, eventsRes, jobRes] = await Promise.all([
    account.get(),
    account.summary.get(),
    account.events.get({ query: { range, type, mutual } }),
    account.jobs.latest.get(),
  ]);

  return {
    filter: { range, type, mutual },
    account: accountRes.data,
    summary: summaryRes.data,
    events: eventsRes.data?.data ?? [],
    latestJob: jobRes.data,
    accountNotFound: summaryRes.status === 404,
  };
};