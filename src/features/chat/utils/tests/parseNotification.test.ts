import { INCOMING, OUTGOING_ECHO, STATUS_DELIVERED } from '@app/test-utils';

import { extractText, extractChatId, parseNotification } from '../parseNotification';

import type { NotificationBody } from '@app/api/types';

const CHAT = '462217484';

describe('parseNotification', () => {
  it('finds text under both textMessage and extendedTextMessage', () => {
    expect(parseNotification(INCOMING)).toMatchObject({ kind: 'incoming', text: 'msg' });
    expect(parseNotification(OUTGOING_ECHO)).toMatchObject({
      kind: 'outgoingEcho',
      text: 'test from api',
    });
  });

  it('finds chatId at both depths', () => {
    // senderData.chatId on message webhooks...
    expect(parseNotification(INCOMING)).toMatchObject({ chatId: CHAT });
    // ...top level on status webhooks.
    expect(parseNotification(STATUS_DELIVERED)).toMatchObject({ kind: 'status', chatId: CHAT });
  });

  it('keeps an 18-digit idMessage exact', () => {
    const id = (parseNotification(INCOMING) as { idMessage: string }).idMessage;
    expect(id).toBe('117365846173366795');
    // Precondition for the whole string-id rule: this value is unsafe as a number.
    expect(Number(id).toString()).not.toBe(id);
  });

  it('skips non-text messages and unknown webhook types', () => {
    const image = {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1,
      idMessage: 'x',
      senderData: { chatId: CHAT, sender: CHAT },
      messageData: { typeMessage: 'imageMessage', fileMessageData: { downloadUrl: 'http://x' } },
    } as unknown as NotificationBody;

    expect(parseNotification(image)).toBeNull();
    expect(parseNotification({ typeWebhook: 'somethingNew' } as unknown as NotificationBody)).toBeNull();
  });

  it('classifies a message sent from the phone itself', () => {
    const fromPhone = { ...OUTGOING_ECHO, typeWebhook: 'outgoingMessageReceived' } as NotificationBody;
    expect(parseNotification(fromPhone)).toMatchObject({ kind: 'outgoingFromPhone' });
  });

  it('reports instance state changes', () => {
    const body = { typeWebhook: 'stateInstanceChanged', stateInstance: 'notAuthorized' } as NotificationBody;
    expect(parseNotification(body)).toEqual({ kind: 'state', stateInstance: 'notAuthorized' });
  });
});

describe('extractText', () => {
  it('returns null for a status notification', () => {
    expect(extractText(STATUS_DELIVERED)).toBeNull();
  });
});

describe('extractChatId', () => {
  it('reads senderData.chatId on message webhooks', () => {
    expect(extractChatId(INCOMING)).toBe(CHAT);
  });
});
