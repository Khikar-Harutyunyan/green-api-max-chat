import { formatPhone } from '../formatPhone';

describe('formatPhone', () => {
  it('prefixes the digits with a plus', () => {
    expect(formatPhone('37441201890')).toBe('+37441201890');
  });
});
