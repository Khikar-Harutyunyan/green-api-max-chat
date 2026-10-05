import type { Message } from '@app/types';
import { mapOutgoingStatus } from './deliveryStatus';
import type { ChatHistoryItem } from '@app/api/types';

export const historyItemToMessage = (item: ChatHistoryItem): Message | null => {
  const text = item.textMessage ?? item.extendedTextMessage?.text ?? null;
  if (text === null || text === '') return null;

  const outgoing = item.type === 'outgoing';
  return {
    localId: `hist:${item.idMessage}`,
    idMessage: item.idMessage,
    chatId: item.chatId,
    direction: outgoing ? 'out' : 'in',
    text,
    timestamp: item.timestamp,
    status: outgoing
      ? item.statusMessage
        ? mapOutgoingStatus(item.statusMessage)
        : 'sent'
      : 'read',
    senderName: item.senderName,
  };
};
