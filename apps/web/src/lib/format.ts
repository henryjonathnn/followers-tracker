export function relativeTimeId(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60)  return 'baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.floor(diffHour / 24)} hari lalu`;
}
