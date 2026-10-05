import { toDigits } from '@app/utils';

describe('toDigits', () => {
  it('keeps only the digits', () => {
    expect(toDigits('+7 (900) 123-45-67')).toBe('79001234567');
  });

  it('returns an empty string when there are no digits', () => {
    expect(toDigits('abc')).toBe('');
  });
});
