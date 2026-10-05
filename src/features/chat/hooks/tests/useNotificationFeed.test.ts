import {
  act,
  CHAT_ID,
  SENT_ID,
  waitFor,
  signedInState,
  installApiMock,
  renderHookWithProviders,
} from '@app/test-utils';
import type { Api } from '@app/test-utils';

import { useNotificationFeed } from '@features/chat/hooks/useNotificationFeed';

import { apiService } from '@app/api/apiService';

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

describe('useNotificationFeed', () => {
  it('puts received messages into the store', async () => {
    const { store, result } = renderHookWithProviders(() => useNotificationFeed(), {
      preloadedState: signedInState(),
    });

    act(() => {
      api.emit({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1790860689,
        idMessage: '117365846173366795',
        senderData: { chatId: CHAT_ID, sender: CHAT_ID, senderName: 'Arpi' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'msg' } },
      });
    });

    await waitFor(() => expect(store.getState().messages.byChat[CHAT_ID]).toHaveLength(1));
    expect(store.getState().chats.chats).toEqual([{ chatId: CHAT_ID, phoneNumber: '', name: 'Arpi' }]);
    expect(result.current.online).toBe(true);
  });

  it('records instance state changes', async () => {
    const { store } = renderHookWithProviders(() => useNotificationFeed(), {
      preloadedState: signedInState(),
    });

    act(() => {
      api.emit({ typeWebhook: 'stateInstanceChanged', stateInstance: 'notAuthorized' });
    });

    // Written into the getStateInstance cache the banner reads.
    const selectInstanceState = apiService.endpoints.getStateInstance.select();
    await waitFor(() => expect(selectInstanceState(store.getState()).data).toBe('notAuthorized'));
  });

  it('applies delivery statuses to sent messages', async () => {
    const sent = {
      localId: 'L1',
      idMessage: SENT_ID,
      chatId: CHAT_ID,
      direction: 'out' as const,
      text: 'hi',
      timestamp: 1,
      status: 'sent' as const,
    };
    const { store } = renderHookWithProviders(() => useNotificationFeed(), {
      preloadedState: signedInState({ messages: { byChat: { [CHAT_ID]: [sent] }, seen: { [SENT_ID]: true } } }),
    });

    act(() => {
      api.emit({ typeWebhook: 'outgoingMessageStatus', chatId: CHAT_ID, idMessage: SENT_ID, status: 'read' });
    });

    await waitFor(() => expect(store.getState().messages.byChat[CHAT_ID]?.[0].status).toBe('read'));
  });

  it('does not poll when signed out', async () => {
    renderHookWithProviders(() => useNotificationFeed());
    await act(async () => {});
    expect(api.methodCalls).toEqual([]);
  });
});
