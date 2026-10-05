import type { ChatId, MessageId } from '@app/api/types';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  text: string;
  chatId: ChatId;
  localId: string;
  timestamp: number;
  senderName?: string;
  status: DeliveryStatus;
  direction: 'in' | 'out';
  idMessage: MessageId | null;
}

export interface Chat {
  name: string;
  chatId: ChatId;
  phoneNumber: string;
  avatarCheckedAt?: number;
  avatarUrl?: string | null;
}
