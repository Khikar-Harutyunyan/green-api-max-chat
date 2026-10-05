import type { Chat } from '@app/types';
import { AVATAR_RECHECK_MS, NO_AVATAR_RECHECK_MS } from '@features/chat/constants/limits';

export const needsAvatarLookup = (chat: Chat, now: number): boolean => {
  if (chat.avatarUrl === undefined) return true;
  const recheckAfterMs = chat.avatarUrl === null ? NO_AVATAR_RECHECK_MS : AVATAR_RECHECK_MS;
  return now - (chat.avatarCheckedAt ?? 0) >= recheckAfterMs;
};
