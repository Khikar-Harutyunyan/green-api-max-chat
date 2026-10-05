import { needsAvatarLookup } from '../needsAvatarLookup';

import { AVATAR_RECHECK_MS, NO_AVATAR_RECHECK_MS } from '@features/chat/constants/limits';

const NOW = 1_800_000_000_000;
const CHAT = { chatId: '111', phoneNumber: '', name: 'Arpi' };

describe('needsAvatarLookup', () => {
  it('looks up a photo that was never checked', () => {
    expect(needsAvatarLookup(CHAT, NOW)).toBe(true);
  });

  it('trusts a photo until it is a week old', () => {
    const chat = { ...CHAT, avatarUrl: 'https://photo', avatarCheckedAt: NOW };
    expect(needsAvatarLookup(chat, NOW + AVATAR_RECHECK_MS - 1)).toBe(false);
    expect(needsAvatarLookup(chat, NOW + AVATAR_RECHECK_MS)).toBe(true);
  });

  it('re-checks "no photo" after a day, so a newly set one shows up', () => {
    const chat = { ...CHAT, avatarUrl: null, avatarCheckedAt: NOW };
    expect(needsAvatarLookup(chat, NOW + NO_AVATAR_RECHECK_MS - 1)).toBe(false);
    expect(needsAvatarLookup(chat, NOW + NO_AVATAR_RECHECK_MS)).toBe(true);
  });

  it('re-checks a stored answer that has no lookup time', () => {
    expect(needsAvatarLookup({ ...CHAT, avatarUrl: null }, NOW)).toBe(true);
  });
});
