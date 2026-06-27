import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { SITE_PASSWORD } from '$env/static/private';

const COOKIE_NAME    = 'ig_tracker_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const expectedToken = () =>
  createHmac('sha256', SITE_PASSWORD).update('authenticated').digest('hex');

export function isCorrectPassword(candidate: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(SITE_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthedCookie(val: string | undefined): boolean {
  if (!val) return false;
  const expected = expectedToken();
  const a = Buffer.from(val);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function setAuthCookie(cookies: Cookies): void {
  cookies.set(COOKIE_NAME, expectedToken(), {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
  });
}

export function getAuthCookieValue(cookies: Cookies): string | undefined {
  return cookies.get(COOKIE_NAME);
}
