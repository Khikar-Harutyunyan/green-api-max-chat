import { rootReducer } from '@app/store/rootReducer';

import type { RootState } from '@app/store';
import type { Credentials, NotificationBody } from '@app/api/types';

export const CREDENTIALS: Credentials = {
  idInstance: '310022752991',
  apiTokenInstance: 'test-token',
  apiUrl: 'https://3100.api.green-api.com',
};

export const INITIAL_STATE: RootState = rootReducer(undefined, { type: '@@init' });

export const signedInState = (overrides: Partial<RootState> = {}): RootState => ({
  ...INITIAL_STATE,
  auth: { ...INITIAL_STATE.auth, credentials: CREDENTIALS },
  ...overrides,
});

export const OUTGOING_ECHO = {
  timestamp: 1790860382,
  idMessage: '1790860382147',
  senderData: {
    chatType: 'user',
    senderType: 'user',
    chatId: '462217484',
    sender: '502194430',
    senderName: 'Khikar',
    senderContactName: '',
    chatName: 'Arpi Meliqsetyan',
    senderPhoneNumber: 37477335528,
  },
  messageData: {
    typeMessage: 'extendedTextMessage',
    extendedTextMessageData: {
      title: '',
      description: '',
      jpegThumbnail: '',
      forwardingScore: 0,
      isForwarded: false,
      previewType: 'None',
      text: 'test from api',
    },
  },
  typeWebhook: 'outgoingAPIMessageReceived',
  instanceData: { idInstance: 310022752991, wid: '37477335528@c.us', typeInstance: 'v3' },
} as unknown as NotificationBody;

export const INCOMING = {
  timestamp: 1790860689,
  idMessage: '117365846173366795',
  typeWebhook: 'incomingMessageReceived',
  senderData: {
    chatType: 'user',
    senderType: 'user',
    chatId: '462217484',
    sender: '462217484',
    chatName: 'Arpi Meliqsetyan',
    senderPhoneNumber: 37441201890,
    senderName: 'Arpi Meliqsetyan',
    senderContactName: 'Arpi Meliqsetyan',
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'msg', forwardingScore: 0, isForwarded: false },
  },
  instanceData: { idInstance: 310022752991, wid: '37477335528@c.us', typeInstance: 'v3' },
} as unknown as NotificationBody;

export const STATUS_DELIVERED = {
  chatId: '462217484',
  status: 'delivered',
  timestamp: 1790860382,
  idMessage: '1790860382147',
  typeWebhook: 'outgoingMessageStatus',
  instanceData: { idInstance: 310022752991, wid: '37477335528@c.us', typeInstance: 'v3' },
} as unknown as NotificationBody;

export const STATUS_READ = { ...STATUS_DELIVERED, status: 'read' } as unknown as NotificationBody;
