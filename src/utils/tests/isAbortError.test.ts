import { isAbortError } from '@app/utils';

describe('isAbortError', () => {
  it('recognises an aborted fetch', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
  });

  it('rejects any other error', () => {
    expect(isAbortError(new Error('boom'))).toBe(false);
  });
});
