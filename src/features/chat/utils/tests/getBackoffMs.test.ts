import { getBackoffMs } from '../getBackoffMs';

describe('getBackoffMs', () => {
  it('doubles with each consecutive failure', () => {
    expect([1, 2, 3, 4].map(getBackoffMs)).toEqual([1000, 2000, 4000, 8000]);
  });

  it('caps the wait at 30 seconds', () => {
    expect(getBackoffMs(10)).toBe(30_000);
  });
});
