import { useEffect } from 'react';

import { selectCredentials } from '@features/sign-in';
import { selectMessagesByChat } from '@features/chat/reducers/messages';
import { selectChats, selectActiveChatId } from '@features/chat/reducers/chats';

import { useAppSelector } from '@app/hooks/redux';

import { saveChats, saveMessages, saveActiveChatId } from '@app/services/storage';

export const usePersistence = (): void => {
  const chats = useAppSelector(selectChats);
  const activeChatId = useAppSelector(selectActiveChatId);
  const byChat = useAppSelector(selectMessagesByChat);
  const idInstance = useAppSelector(selectCredentials)?.idInstance ?? null;

  useEffect(() => {
    if (idInstance) saveChats(idInstance, chats);
  }, [idInstance, chats]);

  useEffect(() => {
    if (idInstance) saveMessages(idInstance, byChat);
  }, [idInstance, byChat]);

  useEffect(() => {
    if (idInstance) saveActiveChatId(idInstance, activeChatId);
  }, [idInstance, activeChatId]);
};
