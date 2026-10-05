import { useRef, useState, useEffect } from 'react';

import { logger } from '@app/services/logger';
import { sleep, isAbortError } from '@app/utils';
import { GreenApiError } from '@app/api/GreenApiError';
import { getBackoffMs } from '@features/chat/utils/getBackoffMs';
import type { Credentials, ParsedNotification } from '@app/api/types';
import { parseNotification } from '@features/chat/utils/parseNotification';
import { deleteNotification, receiveNotification } from '@app/api/greenApi';
import { DEFAULT_RECEIVE_TIMEOUT_SECONDS } from '@features/chat/constants/limits';

export interface UseNotificationsOptions {
  enabled?: boolean;
  receiveTimeoutSeconds?: number;
}

export interface NotificationsStatus {
  online: boolean;
  lastError: GreenApiError | null;
}

export const useNotifications = (
  credentials: Credentials | null,
  onNotification: (notification: ParsedNotification) => void,
  { enabled = true, receiveTimeoutSeconds = DEFAULT_RECEIVE_TIMEOUT_SECONDS }: UseNotificationsOptions = {},
): NotificationsStatus => {
  const [online, setOnline] = useState(true);
  const [lastError, setLastError] = useState<GreenApiError | null>(null);

  const handlerRef = useRef(onNotification);
  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  const apiUrl = credentials?.apiUrl ?? '';
  const idInstance = credentials?.idInstance ?? '';
  const apiTokenInstance = credentials?.apiTokenInstance ?? '';
  const active = Boolean(credentials) && enabled;

  useEffect(() => {
    if (!active) return;

    const pollCredentials = { apiUrl, idInstance, apiTokenInstance };

    const controller = new AbortController();
    const { signal } = controller;
    let consecutiveFailures = 0;

    async function loop() {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(pollCredentials, receiveTimeoutSeconds, signal);
          if (signal.aborted) return;

          if (consecutiveFailures > 0) {
            consecutiveFailures = 0;
            setLastError(null);
          }
          setOnline(true);

          if (!notification) continue;

          const parsed = parseNotification(notification.body);
          if (parsed) handlerRef.current(parsed);

          await deleteNotification(pollCredentials, notification.receiptId, signal);
        } catch (err) {
          if (signal.aborted) return;
          if (isAbortError(err)) return;

          consecutiveFailures += 1;
          logger.warn(`Notification polling failed (attempt ${consecutiveFailures})`, err);
          setOnline(false);
          setLastError(
            err instanceof GreenApiError
              ? err
              : new GreenApiError('receiveNotification', 0, '', String(err)),
          );
          await sleep(getBackoffMs(consecutiveFailures), signal);
        }
      }
    }

    void loop();
    return () => controller.abort();
  }, [active, apiUrl, idInstance, apiTokenInstance, receiveTimeoutSeconds]);

  return { online, lastError };
};
