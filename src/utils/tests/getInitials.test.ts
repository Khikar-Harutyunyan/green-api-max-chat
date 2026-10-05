import { getInitials } from '@app/utils';

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('Gegham Xachatryan')).toBe('GX');
  });

  it('takes the first two characters of a single word', () => {
    expect(getInitials('max')).toBe('MA');
  });

  it('ignores a leading plus on phone numbers', () => {
    expect(getInitials('+37441201890')).toBe('37');
  });

  it('falls back to a question mark for an empty name', () => {
    expect(getInitials('  ')).toBe('?');
  });
});
