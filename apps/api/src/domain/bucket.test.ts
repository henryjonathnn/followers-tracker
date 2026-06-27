import { describe, it, expect } from 'bun:test';
import { getBucket } from './bucket';

const MS = (h: number) => h * 60 * 60 * 1000;

describe('getBucket', () => {
  const now = new Date('2024-01-10T12:00:00Z');
  it('just now -> today', () => expect(getBucket(new Date('2024-01-10T11:59:00Z'), now)).toBe('today'));
  it('23h59m ago -> today', () => expect(getBucket(new Date(now.getTime() - MS(23) - 59 * 60000), now)).toBe('today'));
  it('exactly 24h ago -> week', () => expect(getBucket(new Date(now.getTime() - MS(24)), now)).toBe('week'));
  it('3 days ago -> week', () => expect(getBucket(new Date(now.getTime() - MS(72)), now)).toBe('week'));
  it('6.99 days ago -> week', () => expect(getBucket(new Date(now.getTime() - MS(6 * 24 + 23) - 59 * 60000), now)).toBe('week'));
  it('exactly 7 days ago -> expired', () => expect(getBucket(new Date(now.getTime() - MS(7 * 24)), now)).toBe('expired'));
  it('30 days ago -> expired', () => expect(getBucket(new Date(now.getTime() - MS(30 * 24)), now)).toBe('expired'));
  it('defaults now when omitted', () => expect(getBucket(new Date(Date.now() - 60_000))).toBe('today'));
});
