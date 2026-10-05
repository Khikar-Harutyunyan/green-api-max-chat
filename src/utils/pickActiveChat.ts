import type { Chat } from '@app/types';
import type { ChatId } from '@app/api/types';

export const pickActiveChat = (chats: Chat[], remembered: ChatId | null): ChatId | null => {
  if (remembered && chats.some((chat) => chat.chatId === remembered)) return remembered;
  return chats[0]?.chatId ?? null;
};
