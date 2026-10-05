import { GreenApiError } from '../GreenApiError';

describe('GreenApiError', () => {
  it('survives being stored as plain data', () => {
    const original = new GreenApiError('checkAccount', 466, '{"invokeStatus":{"method":"checkAccount"}}');

    const restored = GreenApiError.from(JSON.parse(JSON.stringify(original.serialize())));

    expect(restored).toBeInstanceOf(GreenApiError);
    expect(restored).toMatchObject({ method: 'checkAccount', status: 466, message: original.message });
    expect(restored?.quota?.method).toBe('checkAccount');
  });

  it('returns the error itself when it already is one', () => {
    const error = new GreenApiError('getChats', 500, '');
    expect(GreenApiError.from(error)).toBe(error);
  });

  it('recognizes nothing else', () => {
    expect(GreenApiError.from(new Error('boom'))).toBeUndefined();
    expect(GreenApiError.from({ status: 500 })).toBeUndefined();
    expect(GreenApiError.from(null)).toBeUndefined();
  });

  it('tells a per-second throttle from the two-hour checkAccount pause', () => {
    expect(new GreenApiError('x', 429, '').isThrottled).toBe(true);
    expect(new GreenApiError('x', 469, '').isThrottled).toBe(false);
    expect(new GreenApiError('x', 469, '').isRateLimited).toBe(true);
  });
});
