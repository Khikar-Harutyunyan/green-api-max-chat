import { useCallback } from 'react';

import { selectCredentials } from '@features/sign-in';
import { onAddChat } from '@features/chat/reducers/chats';
import { onReceiveMessage, onSetMessageStatus } from '@features/chat/reducers/messages';

import { useAppDispatch, useAppSelector } from '@app/hooks/redux';
import { useNotifications } from '@features/chat/hooks/useNotifications';

import { apiService } from '@app/api/apiService';
import type { InstanceState } from '@app/api/types';
import type { ParsedNotification } from '@app/api/types';
import type { NotificationsStatus } from '@features/chat/hooks/useNotifications';

export const useNotificationFeed = (): NotificationsStatus => {
  const dispatch = useAppDispatch();
  const credentials = useAppSelector(selectCredentials);

  const handleNotification = useCallback(
    (notification: ParsedNotification) => {
      switch (notification.kind) {
        case 'state':
          void dispatch(
            apiService.util.upsertQueryData(
              'getStateInstance',
              undefined,
              notification.stateInstance as InstanceState,
            ),
          );
          return;
        case 'status':
          dispatch(onSetMessageStatus(notification));
          return;
        case 'incoming':
          dispatch(onAddChat({ chatId: notification.chatId, name: notification.senderName || notification.chatId }));
          dispatch(onReceiveMessage(notification));
          return;
        default:
          dispatch(onReceiveMessage(notification));
      }
    },
    [dispatch],
  );

  return useNotifications(credentials, handleNotification);
};
