import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('formats unix seconds as hours and minutes', () => {
    expect(formatTime(1790860382)).toMatch(/^\d{2}:\d{2}$/);
  });
});
