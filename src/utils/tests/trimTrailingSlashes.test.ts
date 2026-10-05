import { trimTrailingSlashes } from '@app/utils';

describe('trimTrailingSlashes', () => {
  it('removes every trailing slash', () => {
    expect(trimTrailingSlashes('https://3100.api.green-api.com//')).toBe(
      'https://3100.api.green-api.com',
    );
  });

  it('leaves a URL without trailing slashes untouched', () => {
    expect(trimTrailingSlashes('https://x.com/a')).toBe('https://x.com/a');
  });
});
