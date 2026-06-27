import type { Member, Unfollower, DiffResult } from './types';

export function diffSnapshots(
  prevFollowers: Member[],
  currFollowers: Member[],
  currFollowing: Member[],
): DiffResult {
  const prevIds      = new Set(prevFollowers.map((m) => m.igId));
  const currIds      = new Set(currFollowers.map((m) => m.igId));
  const followingIds = new Set(currFollowing.map((m) => m.igId));

  const newFollowers = currFollowers.filter((m) => !prevIds.has(m.igId));
  const unfollowers: Unfollower[] = prevFollowers
    .filter((m) => !currIds.has(m.igId))
    .map((m) => ({ ...m, wasMutual: followingIds.has(m.igId) }));

  return { newFollowers, unfollowers };
}
