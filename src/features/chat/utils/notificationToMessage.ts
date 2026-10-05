import type { Message } from '@app/types';
import type { ParsedNotification } from '@app/api/types';

export const notificationToMessage = (parsed: ParsedNotification): Message | null => {
  switch (parsed.kind) {
    case 'incoming':
      return {
        localId: `in:${parsed.idMessage}`,
        idMessage: parsed.idMessage,
        chatId: parsed.chatId,
        direction: 'in',
        text: parsed.text,
        timestamp: parsed.timestamp,
        status: 'read',
        senderName: parsed.senderName,
      };

    case 'outgoingEcho':
      return {
        localId: `out:${parsed.idMessage}`,
        idMessage: parsed.idMessage,
        chatId: parsed.chatId,
        direction: 'out',
        text: parsed.text,
        timestamp: parsed.timestamp,
        status: 'sent',
      };

    case 'outgoingFromPhone':
      return {
        localId: `phone:${parsed.idMessage}`,
        idMessage: parsed.idMessage,
        chatId: parsed.chatId,
        direction: 'out',
        text: parsed.text,
        timestamp: parsed.timestamp,
        status: 'sent',
      };

    default:
      return null;
  }
};
