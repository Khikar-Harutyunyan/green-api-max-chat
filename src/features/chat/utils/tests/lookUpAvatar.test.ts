import type { Api } from '@app/test-utils';
import { json, signedInState, installApiMock } from '@app/test-utils';

import type { AvatarSource } from '../lookUpAvatar';
import { lookUpAvatar, areAvatarSourcesSpent } from '../lookUpAvatar';

import type { AppDispatch } from '@app/store';

import { setupStore } from '@app/store';

let api: Api;
let dispatch: AppDispatch;

beforeEach(() => {
  api = installApiMock();
  ({ dispatch } = setupStore(signedInState()));
});

/** Answers every call to `method` with `status`. */
const failMethod = (method: string, status: number) => {
  const apiFetch = globalThis.fetch;
  globalThis.fetch = jest.fn((input: unknown, init?: RequestInit) =>
    String(input).includes(`/${method}/`)
      ? Promise.resolve(json({}, status))
      : apiFetch(input as RequestInfo, init),
  ) as unknown as typeof fetch;
};

describe('lookUpAvatar', () => {
  it('asks getAvatar first', async () => {
    api.avatars['111'] = 'https://photo';
    await expect(lookUpAvatar(dispatch, '111', new Set())).resolves.toBe('https://photo');
    expect(api.contactInfoLookups).toEqual([]);
  });

  it('returns null for a contact with no photo', async () => {
    await expect(lookUpAvatar(dispatch, '111', new Set())).resolves.toBeNull();
  });

  it("falls back to getContactInfo once getAvatar's quota is spent", async () => {
    api.avatars['111'] = 'https://photo';
    failMethod('getAvatar', 466);
    const spent = new Set<AvatarSource>();

    await expect(lookUpAvatar(dispatch, '111', spent)).resolves.toBe('https://photo');
    expect(spent).toEqual(new Set(['getAvatar']));
  });

  it('skips a spent source without calling it', async () => {
    api.avatars['111'] = 'https://photo';
    await lookUpAvatar(dispatch, '111', new Set<AvatarSource>(['getAvatar']));
    expect(api.methodCalls).not.toContain('getAvatar');
    expect(api.contactInfoLookups).toEqual(['111']);
  });

  it('does not fall back on errors other than a spent quota', async () => {
    failMethod('getAvatar', 500);
    await expect(lookUpAvatar(dispatch, '111', new Set())).rejects.toMatchObject({
      method: 'getAvatar',
      status: 500,
    });
    expect(api.contactInfoLookups).toEqual([]);
  });

  it('throws once every source is spent', async () => {
    const spent = new Set<AvatarSource>(['getAvatar', 'getContactInfo']);
    await expect(lookUpAvatar(dispatch, '111', spent)).rejects.toThrow();
    expect(areAvatarSourcesSpent(spent)).toBe(true);
    expect(areAvatarSourcesSpent(new Set<AvatarSource>(['getAvatar']))).toBe(false);
  });
});
