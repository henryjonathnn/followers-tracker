import { redirect, type Handle } from '@sveltejs/kit';
import { getAuthCookieValue, isAuthedCookie } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const authed = isAuthedCookie(getAuthCookieValue(event.cookies));
  event.locals.authed = authed;
  const isLogin = event.url.pathname === '/login';
  if (!authed && !isLogin) redirect(303, '/login');
  if (authed  &&  isLogin) redirect(303, '/');
  return resolve(event);
};
