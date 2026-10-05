import {
  INCOMING,
  CREDENTIALS,
  STATUS_READ,
  OUTGOING_ECHO,
  INITIAL_STATE,
  signedInState,
  installApiMock,
  STATUS_DELIVERED,
} from '@app/test-utils';
import type { UnknownAction } from '@reduxjs/toolkit';

import messagesReducer, {
  onQueueMessage,
  onReceiveMessage,
  onSetMessageSent,
  onSetMessageFailed,
  onSetMessageStatus,
} from '../messages';
import type { IMessages } from '../messages';

import type { Message } from '@app/types';
import { apiService } from '@app/api/apiService';
import type { NotificationBody } from '@app/api/types';
import { parseNotification } from '@features/chat/utils/parseNotification';

import { setupStore } from '@app/store';
import { onLogin } from '@features/sign-in';

const CHAT = '462217484';

const run = (actions: UnknownAction[], from: IMessages = INITIAL_STATE.messages) =>
  actions.reduce(messagesReducer, from);

const notify = (body: NotificationBody) => {
  const parsed = parseNotification(body);
  if (!parsed || parsed.kind === 'state') throw new Error('expected a message or a status');
  // The same routing useNotificationFeed does.
  return parsed.kind === 'status' ? onSetMessageStatus(parsed) : onReceiveMessage(parsed);
};

const messages = (state: IMessages) => state.byChat[CHAT] ?? [];

const queued = onQueueMessage({ localId: 'L1', chatId: CHAT, text: 'test from api', timestamp: 1790860382 });
const sent = onSetMessageSent({ localId: 'L1', chatId: CHAT, idMessage: '1790860382147' });

const historyMessage = (idMessage: string, text: string, timestamp: number): Message => ({
  localId: `hist:${idMessage}`,
  idMessage,
  chatId: CHAT,
  direction: 'in',
  text,
  timestamp,
  status: 'read',
});

describe('messages', () => {
  it('optimistic send, then echo, then statuses, stays a single bubble', () => {
    const state = run([queued, sent, notify(OUTGOING_ECHO), notify(STATUS_DELIVERED), notify(STATUS_READ)]);

    expect(messages(state)).toHaveLength(1);
    expect(messages(state)[0]).toMatchObject({ localId: 'L1', status: 'read' });
  });

  it('echo arriving BEFORE sendMessage resolves adopts the pending bubble', () => {
    const state = run([queued, notify(OUTGOING_ECHO), sent]);

    expect(messages(state)).toHaveLength(1);
    expect(messages(state)[0]).toMatchObject({ idMessage: '1790860382147', status: 'sent' });
  });

  it('redelivery of the same notification yields one message', () => {
    expect(messages(run([notify(INCOMING), notify(INCOMING)]))).toHaveLength(1);
  });

  it('status never regresses', () => {
    const state = run([queued, sent, notify(STATUS_READ), notify(STATUS_DELIVERED)]);
    expect(messages(state)[0].status).toBe('read');
  });

  it('an echo with no optimistic bubble is appended exactly once', () => {
    const state = run([notify(OUTGOING_ECHO), notify(OUTGOING_ECHO)]);
    expect(messages(state)).toHaveLength(1);
    expect(messages(state)[0].direction).toBe('out');
  });

  it('incoming reply lands as an inbound bubble', () => {
    const state = run([notify(INCOMING)]);
    expect(messages(state)[0]).toMatchObject({
      direction: 'in',
      senderName: 'Arpi Meliqsetyan',
    });
  });

  it('send failure marks the bubble failed', () => {
    const state = run([
      onQueueMessage({ localId: 'L1', chatId: CHAT, text: 'nope', timestamp: 1 }),
      onSetMessageFailed({ localId: 'L1', chatId: CHAT }),
    ]);
    expect(messages(state)[0].status).toBe('failed');
  });

  it('merges history in chronological order without duplicating live messages', async () => {
    const historyItem = (idMessage: string, textMessage: string, timestamp: number) => ({
      type: 'incoming',
      chatId: CHAT,
      idMessage,
      timestamp,
      textMessage,
      typeMessage: 'textMessage',
    });
    const api = installApiMock();
    // Newest first, as getChatHistory returns it, and overlapping the live one.
    api.historyByChat[CHAT] = [
      historyItem('117365846173366795', 'msg', 1790860689),
      historyItem('h2', 'второе', 1790860500),
      historyItem('h1', 'первое', 1790860400),
    ];
    const store = setupStore(signedInState({ messages: run([notify(INCOMING)]) }));

    await store.dispatch(apiService.endpoints.getChatHistory.initiate(CHAT, { subscribe: false }));

    expect(messages(store.getState().messages).map((m) => m.text)).toEqual(['первое', 'второе', 'msg']);
  });

  it('restores persisted messages on login', () => {
    const stored = { [CHAT]: [{ ...historyMessage('h1', 'hi', 1), status: 'pending' as const }] };
    const restored = run([onLogin({ credentials: CREDENTIALS, chats: [], activeChatId: null, byChat: stored })]);

    expect(messages(restored)[0].status).toBe('failed');
    expect(restored.seen).toEqual({ h1: true });
  });
});
