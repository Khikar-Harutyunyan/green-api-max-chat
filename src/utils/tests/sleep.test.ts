import { sleep } from '@app/utils';

describe('sleep', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves after the given delay', async () => {
    const done = jest.fn();
    void sleep(1000, new AbortController().signal).then(done);

    await jest.advanceTimersByTimeAsync(999);
    expect(done).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });

  it('resolves immediately when aborted', async () => {
    const controller = new AbortController();
    const done = jest.fn();
    void sleep(30_000, controller.signal).then(done);

    controller.abort();
    await jest.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalled();
  });
});
