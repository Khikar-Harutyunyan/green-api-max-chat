import { createLocalId } from '@app/utils';

describe('createLocalId', () => {
  it('returns a different id on every call', () => {
    expect(createLocalId()).not.toBe(createLocalId());
  });
});
