import { isHttpUrl } from '@app/utils';

describe('isHttpUrl', () => {
  it('accepts http and https addresses, ignoring surrounding spaces', () => {
    expect(isHttpUrl('https://3100.api.green-api.com')).toBe(true);
    expect(isHttpUrl(' http://localhost:8080/ ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl('3100.api.green-api.com')).toBe(false);
    expect(isHttpUrl('ftp://3100.api.green-api.com')).toBe(false);
  });
});
