import type { Chat } from '@app/types';
import { formatPhone } from './formatPhone';
import type { ChatSummary } from '@app/api/types';

export const mergeChats = (existing: Chat[], remote: ChatSummary[]): Chat[] => {
  const byId = new Map(existing.map((chat) => [chat.chatId, chat]));

  for (const summary of remote) {
    const known = byId.get(summary.chatId);
    const phoneNumber =
      known?.phoneNumber || (summary.phoneNumber ? String(summary.phoneNumber) : '');

    byId.set(summary.chatId, {
      phoneNumber,
      chatId: summary.chatId,
      avatarUrl: known?.avatarUrl,
      avatarCheckedAt: known?.avatarCheckedAt,
      name: summary.name || known?.name || (phoneNumber ? formatPhone(phoneNumber) : summary.chatId),
    });
  }

  return [...byId.values()];
};
