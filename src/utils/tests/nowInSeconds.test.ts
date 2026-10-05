import { nowInSeconds } from '@app/utils';

describe('nowInSeconds', () => {
  it('returns the current time in whole unix seconds', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1790860382999);
    expect(nowInSeconds()).toBe(1790860382);
    jest.restoreAllMocks();
  });
});
