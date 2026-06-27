import type { Bucket } from './types';

const ONE_DAY_MS  = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

export function getBucket(detectedAt: Date, now: Date = new Date()): Bucket {
  const ageMs = now.getTime() - detectedAt.getTime();
  if (ageMs < ONE_DAY_MS)  return 'today';
  if (ageMs < ONE_WEEK_MS) return 'week';
  return 'expired';
}
