import { describe, it, expect } from 'bun:test';
import { diffSnapshots } from './diff';
import type { Member } from './types';

const m = (igId: string, username = igId): Member => ({ igId, username });

describe('diffSnapshots', () => {
  it('detects a new follower', () => {
    const r = diffSnapshots([], [m('A')], []);
    expect(r.newFollowers).toEqual([m('A')]);
    expect(r.unfollowers).toEqual([]);
  });
  it('detects plain unfollow (not mutual)', () => {
    const r = diffSnapshots([m('A')], [], []);
    expect(r.unfollowers[0]?.wasMutual).toBe(false);
  });
  it('flags wasMutual when we still follow back', () => {
    const r = diffSnapshots([m('A')], [], [m('A')]);
    expect(r.unfollowers[0]?.wasMutual).toBe(true);
  });
  it('no changes -> empty diff', () => {
    const r = diffSnapshots([m('A')], [m('A')], [m('A')]);
    expect(r.newFollowers).toHaveLength(0);
    expect(r.unfollowers).toHaveLength(0);
  });
  it('handles simultaneous new + unfollow', () => {
    const r = diffSnapshots([m('A')], [m('B')], []);
    expect(r.newFollowers.map((x) => x.igId)).toEqual(['B']);
    expect(r.unfollowers.map((x) => x.igId)).toEqual(['A']);
  });
  it('empty prev -> everyone is new', () => {
    const r = diffSnapshots([], [m('A'), m('B'), m('C')], []);
    expect(r.newFollowers).toHaveLength(3);
    expect(r.unfollowers).toHaveLength(0);
  });
  it('preserves metadata', () => {
    const full: Member = { igId: 'A', username: 'alice', profilePicUrl: 'https://x.com/pic.jpg' };
    const r = diffSnapshots([full], [], []);
    expect(r.unfollowers[0]).toMatchObject({ igId: 'A', username: 'alice', profilePicUrl: 'https://x.com/pic.jpg' });
  });
});
