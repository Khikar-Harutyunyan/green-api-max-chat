import { json, CREDENTIALS, INITIAL_STATE, signedInState } from '@app/test-utils';

import { apiService } from '../apiService';
import { logger } from '@app/services/logger';

import { setupStore } from '@app/store';

const answer = (...statuses: number[]) => {
  let call = 0;
  globalThis.fetch = jest.fn(() => {
    const status = statuses[Math.min(call, statuses.length - 1)];
    call += 1;
    return Promise.resolve(json(status === 200 ? [] : {}, status));
  }) as unknown as typeof fetch;
};

const getChats = (store = setupStore(signedInState())) =>
  store.dispatch(apiService.endpoints.getChats.initiate(undefined, { subscribe: false }));

afterEach(() => jest.useRealTimers());

describe('apiService', () => {
  it('calls GREEN-API with the signed-in credentials', async () => {
    answer(200);

    const { data } = await getChats();

    expect(data).toEqual([]);
    const url = String(jest.mocked(globalThis.fetch).mock.calls[0][0]);
    expect(url).toContain(`/waInstance${CREDENTIALS.idInstance}/getChats/`);
  });

  it('sends nothing while signed out', async () => {
    answer(200);

    const { error } = await getChats(setupStore(INITIAL_STATE));

    expect(error).toMatchObject({ status: 401 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('stores a failure as plain data and logs it', async () => {
    answer(500);

    const { error } = await getChats();

    expect(error).toEqual({
      name: 'GreenApiError',
      status: 500,
      method: 'getChats',
      payload: '{}',
      message: 'getChats failed with HTTP 500',
    });
    expect(logger.warn).toHaveBeenCalledWith('getChats request failed', expect.objectContaining({ status: 500 }));
  });

  it('does not retry an error that would only fail again', async () => {
    answer(500);
    await getChats();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('repeats a call that hit the one-per-second limit', async () => {
    jest.useFakeTimers();
    answer(429, 200);

    const request = getChats();
    await jest.advanceTimersByTimeAsync(1000);
    const { data } = await request;

    expect(data).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after two retries', async () => {
    jest.useFakeTimers();
    answer(429);

    const request = getChats();
    await jest.advanceTimersByTimeAsync(1000 + 2000);
    const { error } = await request;

    expect(error).toMatchObject({ status: 429 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });
});
