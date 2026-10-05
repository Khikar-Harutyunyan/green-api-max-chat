import { isDigits } from '@app/utils';

describe('isDigits', () => {
  it('accepts digits, ignoring surrounding spaces', () => {
    expect(isDigits('310022752991')).toBe(true);
    expect(isDigits(' 310022752991 ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isDigits('')).toBe(false);
    expect(isDigits('3100a')).toBe(false);
    expect(isDigits('3100 2752')).toBe(false);
    expect(isDigits('-3100')).toBe(false);
  });
});
