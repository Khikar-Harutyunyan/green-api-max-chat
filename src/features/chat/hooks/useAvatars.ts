import { useRef, useEffect } from 'react';

import { logger } from '@app/services/logger';
import { GreenApiError } from '@app/api/GreenApiError';

import { selectCredentials } from '@features/sign-in';
import { useAppDispatch, useAppSelector } from '@app/hooks/redux';
import { selectChats, onSetAvatars } from '@features/chat/reducers/chats';

import type { ChatId } from '@app/api/types';
import { AVATAR_BATCH_LIMIT } from '@features/chat/constants/limits';
import type { AvatarSource } from '@features/chat/utils/lookUpAvatar';
import { needsAvatarLookup } from '@features/chat/utils/needsAvatarLookup';
import { lookUpAvatar, areAvatarSourcesSpent } from '@features/chat/utils/lookUpAvatar';

/**
 * Looks up profile photos, spending as few API calls as possible.
 *
 * getAvatar has a monthly quota (100 calls on the free tariff); once it is
 * spent it fails with 466 until the month rolls over, and lookups move on to
 * getContactInfo, which has a quota of its own (see `lookUpAvatar`). So a photo is
 * looked up only when `needsAvatarLookup` says the stored answer is missing or
 * stale — an image that stops loading clears its URL, which also counts as
 * missing — and never twice in one session.
 *
 * Every call that reaches the server costs quota, so none is thrown away:
 * - lookups start on a deferred tick, which StrictMode's throwaway mount
 *   cancels before anything is sent;
 * - a lookup in flight is not aborted when the chat list changes (getChats
 *   landing would otherwise discard it and re-request the same photos), only
 *   when the page unmounts;
 * - once every source's quota is spent, lookups stop for the session.
 *
 * Fetched in one batch and applied in a single update: updating per-avatar
 * would re-run this effect after each one.
 */
export const useAvatars = (): void => {
  const dispatch = useAppDispatch();
  const credentials = useAppSelector(selectCredentials);
  const chats = useAppSelector(selectChats);

  // Which chats have had their photo looked up this session.
  const checkedAvatars = useRef<Set<ChatId>>(new Set());
  // Photo sources that answered 466 this session; skipped without a call.
  const spentSources = useRef<Set<AvatarSource>>(new Set());
  // Lives as long as the page, not one effect run: see "not aborted" above.
  const pageLifetime = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    pageLifetime.current = controller;
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const spent = spentSources.current;
    if (!credentials || areAvatarSourcesSpent(spent)) return;
    const checked = checkedAvatars.current;

    const now = Date.now();
    const pending = chats
      .filter((chat) => !checked.has(chat.chatId) && needsAvatarLookup(chat, now))
      .slice(0, AVATAR_BATCH_LIMIT)
      .map((chat) => chat.chatId);
    if (pending.length === 0) return;

    const timer = setTimeout(() => {
      const signal = pageLifetime.current?.signal;
      if (!signal || signal.aborted) return;
      for (const chatId of pending) checked.add(chatId);

      void Promise.all(
        pending.map((chatId) =>
          lookUpAvatar(dispatch, chatId, spent)
            .then((url) => [chatId, url] as const)
            .catch((error) => {
              if (!GreenApiError.from(error)) logger.warn('Could not look up a profile photo', error);
              return null;
            }),
        ),
      ).then((results) => {
        if (signal.aborted) return;
        const found = results.filter((result) => result !== null);
        if (found.length > 0) dispatch(onSetAvatars(Object.fromEntries(found)));
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [credentials, chats, dispatch]);
};
