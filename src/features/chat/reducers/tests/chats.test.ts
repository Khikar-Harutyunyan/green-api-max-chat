import { json, CREDENTIALS, signedInState, INITIAL_STATE, installApiMock } from '@app/test-utils';

import chatsReducer, {
  onAddChat,
  createChat,
  onCloseChat,
  onSelectChat,
  onSetAvatars,
  onClearAvatar,
  selectActiveChat,
} from '../chats';
import type { IChats } from '../chats';

import { apiService } from '@app/api/apiService';

import { setupStore } from '@app/store';
import { onLogin } from '@features/sign-in';

const CHAT = { chatId: '111', phoneNumber: '', name: 'Первый' };

/** Runs a real getChats, answered with one account chat, from the given chats state. */
const loadRemoteChats = async (from: IChats = INITIAL_STATE.chats) => {
  const api = installApiMock();
  api.chats.push({ chatId: '222', name: 'Второй', type: 'user', phoneNumber: 0 });
  const store = setupStore(signedInState({ chats: from }));
  await store.dispatch(apiService.endpoints.getChats.initiate(undefined, { subscribe: false }));
  return store.getState().chats;
};

describe('chats', () => {
  it('selects a chat', () => {
    expect(chatsReducer(INITIAL_STATE.chats, onSelectChat('111')).activeChatId).toBe('111');
  });

  it('merges the account chats and opens the first when nothing is open', async () => {
    const state = await loadRemoteChats();
    expect(state.chats.map((chat) => chat.chatId)).toEqual(['222']);
    expect(state.activeChatId).toBe('222');
  });

  it('keeps the open chat when the account chats arrive', async () => {
    const state = await loadRemoteChats({ ...INITIAL_STATE.chats, chats: [CHAT], activeChatId: '111' });
    expect(state.chats.map((chat) => chat.chatId)).toEqual(['111', '222']);
    expect(state.activeChatId).toBe('111');
  });

  it('applies looked-up avatars, recording null for none', () => {
    const state = chatsReducer(
      { ...INITIAL_STATE.chats, chats: [CHAT, { ...CHAT, chatId: '222' }] },
      onSetAvatars({ '111': 'https://photo', '222': null }),
    );
    expect(state.chats.map((chat) => chat.avatarUrl)).toEqual(['https://photo', null]);
    expect(state.chats[0].avatarCheckedAt).toEqual(expect.any(Number));
  });

  it('forgets a photo that stopped loading, so it is looked up again', () => {
    const state = chatsReducer(
      {
        ...INITIAL_STATE.chats,
        chats: [{ ...CHAT, avatarUrl: 'https://expired', avatarCheckedAt: 1 }],
      },
      onClearAvatar('111'),
    );
    expect(state.chats[0].avatarUrl).toBeUndefined();
    expect(state.chats[0].avatarCheckedAt).toBeUndefined();
  });

  it('adds a chat for a message from an unknown sender, once', () => {
    const added = chatsReducer(INITIAL_STATE.chats, onAddChat({ chatId: '999', name: 'Незнакомец' }));
    expect(added.chats).toEqual([{ chatId: '999', phoneNumber: '', name: 'Незнакомец' }]);

    expect(chatsReducer(added, onAddChat({ chatId: '999', name: 'Другое имя' }))).toBe(added);
  });

  it('restores chats on login', () => {
    const state = chatsReducer(
      INITIAL_STATE.chats,
      onLogin({ credentials: CREDENTIALS, chats: [CHAT], activeChatId: '111', byChat: {} }),
    );
    expect(state).toMatchObject({ chats: [CHAT], activeChatId: '111' });
  });

  it('selects the active chat object', () => {
    const state = signedInState({ chats: { ...INITIAL_STATE.chats, chats: [CHAT], activeChatId: '111' } });
    expect(selectActiveChat(state)).toBe(CHAT);
  });
});

describe('createChat', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and opens the chat returned by checkAccount', async () => {
    installApiMock();
    const store = setupStore(signedInState());

    await store.dispatch(createChat('+374 41 201890'));

    expect(store.getState().chats.chats).toEqual([
      { chatId: '462217484', phoneNumber: '37441201890', name: '+37441201890' },
    ]);
    expect(store.getState().chats.activeChatId).toBe('462217484');
  });

  it('opens a chat already known by phone without calling the API', async () => {
    installApiMock();
    const known = { chatId: '555', phoneNumber: '37441201890', name: 'Arpi' };
    const store = setupStore(signedInState({ chats: { ...INITIAL_STATE.chats, chats: [known] } }));

    await store.dispatch(createChat('37441201890'));

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(store.getState().chats.activeChatId).toBe('555');
  });

  it('rejects with a readable message', async () => {
    globalThis.fetch = jest.fn(() => Promise.resolve(json({ exist: false }))) as unknown as typeof fetch;
    const store = setupStore(signedInState());

    const result = await store.dispatch(createChat('79990000000'));

    expect(result.payload).toBe('Этот номер не зарегистрирован в MAX');
  });

  it('does not ask about the same number twice', async () => {
    // Repeated lookups of numbers that do not exist pause checkAccount for two hours.
    globalThis.fetch = jest.fn(() => Promise.resolve(json({ exist: false }))) as unknown as typeof fetch;
    const store = setupStore(signedInState());

    await store.dispatch(createChat('79990000000'));
    await store.dispatch(createChat('79990000000'));

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('chat panel on narrow screens', () => {
  it('opens when a chat is selected and closes on back', () => {
    const opened = chatsReducer(INITIAL_STATE.chats, onSelectChat('111'));
    expect(opened.isChatOpen).toBe(true);

    const closed = chatsReducer(opened, onCloseChat());
    expect(closed).toMatchObject({ isChatOpen: false, activeChatId: '111' });
  });

  it('stays on the list when a chat is only auto-selected', async () => {
    const state = await loadRemoteChats();
    expect(state).toMatchObject({ activeChatId: '222', isChatOpen: false });
  });
});
