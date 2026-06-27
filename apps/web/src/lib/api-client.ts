import { treaty } from '@elysiajs/eden';
import type { App } from '../../../api/src/api/app';
import { PUBLIC_API_URL } from '$env/static/public';

export function createApiClient(fetcher: typeof fetch = fetch) {
  return treaty<App>(PUBLIC_API_URL, { fetcher });
}
