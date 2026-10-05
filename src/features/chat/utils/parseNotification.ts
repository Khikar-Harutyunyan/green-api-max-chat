import type { ChatId, NotificationBody, ParsedNotification } from '@app/api/types';

export const extractText = (body: NotificationBody): string | null => {
  if (!('messageData' in body)) return null;
  const data = body.messageData;
  return data?.textMessageData?.textMessage ?? data?.extendedTextMessageData?.text ?? null;
};

export const extractChatId = (body: NotificationBody): ChatId | null => {
  if ('senderData' in body) return body.senderData?.chatId ?? null;
  if ('chatId' in body) return body.chatId ?? null;
  return null;
};

export const parseNotification = (body: NotificationBody): ParsedNotification | null => {
  if (!body || typeof body !== 'object' || !('typeWebhook' in body)) return null;

  switch (body.typeWebhook) {
    case 'stateInstanceChanged':
      return { kind: 'state', stateInstance: body.stateInstance };

    case 'outgoingMessageStatus': {
      const chatId = extractChatId(body);
      if (!chatId) return null;
      return { kind: 'status', chatId, idMessage: body.idMessage, status: body.status };
    }

    case 'incomingMessageReceived':
    case 'outgoingAPIMessageReceived':
    case 'outgoingMessageReceived': {
      const chatId = extractChatId(body);
      const text = extractText(body);
      if (!chatId || text === null) return null;

      const common = { chatId, idMessage: body.idMessage, text, timestamp: body.timestamp };
      if (body.typeWebhook === 'incomingMessageReceived') {
        return { kind: 'incoming', ...common, senderName: body.senderData?.senderName };
      }
      if (body.typeWebhook === 'outgoingAPIMessageReceived') {
        return { kind: 'outgoingEcho', ...common };
      }
      return { kind: 'outgoingFromPhone', ...common };
    }

    default:
      return null;
  }
};
