import type { ChatId } from '@app/api/types';
import type { AppDispatch } from '@app/store';
import { apiService } from '@app/api/apiService';
import { GreenApiError } from '@app/api/GreenApiError';

/**
 * The methods that return a contact's photo, in order of preference. Each is
 * metered on its own monthly quota, so when one is spent the next still works.
 */
const AVATAR_SOURCES = [
  {
    method: 'getAvatar',
    fetchUrl: (dispatch: AppDispatch, chatId: ChatId) =>
      dispatch(apiService.endpoints.getAvatar.initiate(chatId, { subscribe: false })).unwrap(),
  },
  {
    method: 'getContactInfo',
    fetchUrl: (dispatch: AppDispatch, chatId: ChatId) =>
      dispatch(apiService.endpoints.getContactInfo.initiate(chatId, { subscribe: false })).unwrap(),
  },
] as const;

export type AvatarSource = (typeof AVATAR_SOURCES)[number]['method'];

/** True once every source has reported its quota spent. */
export const areAvatarSourcesSpent = (spent: ReadonlySet<AvatarSource>): boolean =>
  AVATAR_SOURCES.every((source) => spent.has(source.method));

/**
 * Resolves a chat's photo URL, or null when the contact has none.
 *
 * Tries each source whose quota is not yet spent, recording into `spent` any
 * that answers 466 so later lookups skip it without spending a call. Throws on
 * any other failure, or when every source is spent.
 */
export const lookUpAvatar = async (
  dispatch: AppDispatch,
  chatId: ChatId,
  spent: Set<AvatarSource>,
): Promise<string | null> => {
  for (const source of AVATAR_SOURCES) {
    if (spent.has(source.method)) continue;
    try {
      return (await source.fetchUrl(dispatch, chatId)) || null;
    } catch (error) {
      if (!GreenApiError.from(error)?.isQuotaExceeded) throw error;
      spent.add(source.method);
    }
  }
  throw new Error('Every avatar source has spent its quota');
};
