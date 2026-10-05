import { act, CREDENTIALS, signedInState, INITIAL_STATE, renderHookWithProviders } from '@app/test-utils';

import { usePersistence } from '@features/chat/hooks/usePersistence';

import { onSelectChat } from '@features/chat/reducers/chats';

const CHATS = [
  { chatId: '111', phoneNumber: '', name: 'Первый' },
  { chatId: '222', phoneNumber: '', name: 'Второй' },
];

const stored = (key: string) => JSON.parse(localStorage.getItem(key) as string);

beforeEach(() => {
  localStorage.clear();
});

describe('usePersistence', () => {
  it('saves chats, messages and the open chat under the instance id', () => {
    renderHookWithProviders(() => usePersistence(), {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: CHATS, activeChatId: '111' },
      }),
    });

    const id = CREDENTIALS.idInstance;
    expect(stored(`max-chat.chats.${id}`)).toEqual(CHATS);
    expect(stored(`max-chat.messages.${id}`)).toEqual({});
    expect(stored(`max-chat.activeChat.${id}`)).toBe('111');
  });

  it('saves again when the state changes', () => {
    const { store } = renderHookWithProviders(() => usePersistence(), {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: CHATS, activeChatId: '111' },
      }),
    });

    act(() => {
      store.dispatch(onSelectChat('222'));
    });

    expect(stored(`max-chat.activeChat.${CREDENTIALS.idInstance}`)).toBe('222');
  });

  it('writes nothing when signed out', () => {
    renderHookWithProviders(() => usePersistence());
    expect(localStorage.length).toBe(0);
  });
});
