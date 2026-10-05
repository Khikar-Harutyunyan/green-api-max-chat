import { isFilled } from '@app/utils';

describe('isFilled', () => {
  it('accepts text', () => {
    expect(isFilled(' a ')).toBe(true);
  });

  it('rejects empty or whitespace-only text', () => {
    expect(isFilled('')).toBe(false);
    expect(isFilled('   ')).toBe(false);
  });
});
