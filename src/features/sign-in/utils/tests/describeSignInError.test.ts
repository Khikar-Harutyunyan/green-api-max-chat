import { describeSignInError } from '../describeSignInError';

import { GreenApiError } from '@app/api/GreenApiError';

const goOffline = () => jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

describe('describeSignInError', () => {
  afterEach(() => jest.restoreAllMocks());

  it('blames apiUrl when the address does not answer', () => {
    expect(describeSignInError(new GreenApiError('x', 0, ''))).toBe(
      'Не удалось подключиться по apiUrl — проверьте apiUrl и idInstance',
    );
  });

  it('reports a lost connection while offline', () => {
    goOffline();
    expect(describeSignInError(new GreenApiError('x', 0, ''))).toBe('Нет подключения к интернету');
  });

  it('leaves other errors to describeError', () => {
    expect(describeSignInError(new GreenApiError('x', 401, ''))).toBe(
      'Неверные idInstance или apiTokenInstance',
    );
  });
});
