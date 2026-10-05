import type { Message } from '@app/types';
import type { ChatId } from '@app/api/types';
import type { IMessages } from '@features/chat/reducers/messages';

export const hydrateMessages = (stored: Record<ChatId, Message[]>): IMessages => {
  const byChat: Record<ChatId, Message[]> = {};
  const seen: IMessages['seen'] = {};

  for (const [chatId, messages] of Object.entries(stored)) {
    byChat[chatId] = messages.map((message) => {
      if (message.idMessage !== null) seen[message.idMessage] = true;
      return message.status === 'pending' ? { ...message, status: 'failed' } : message;
    });
  }
  return { byChat, seen };
};
