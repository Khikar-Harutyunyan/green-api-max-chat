import { deriveApiUrl } from '../deriveApiUrl';

describe('deriveApiUrl', () => {
  it('builds the host from the first four digits', () => {
    expect(deriveApiUrl('310022752991')).toBe('https://3100.api.green-api.com');
  });

  it('returns an empty string until four digits are typed', () => {
    expect(deriveApiUrl('310')).toBe('');
  });
});
