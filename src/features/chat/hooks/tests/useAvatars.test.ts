import { createElement } from 'react';

import {
  act,
  json,
  waitFor,
  signedInState,
  INITIAL_STATE,
  installApiMock,
  renderWithProviders,
  renderHookWithProviders,
} from '@app/test-utils';
import type { Api } from '@app/test-utils';

import { useAvatars } from '@features/chat/hooks/useAvatars';

import { onAddChat } from '@features/chat/reducers/chats';

import type { Chat } from '@app/types';


const CHATS: Chat[] = [
  { chatId: '111', phoneNumber: '', name: 'Arpi' },
  { chatId: '222', phoneNumber: '', name: 'Gegham' },
];
const NEW_CHAT = { chatId: '333', name: 'Melanya' };

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

const renderWithChats = (chats: Chat[] = CHATS) =>
  renderHookWithProviders(() => useAvatars(), {
    preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats } }),
  });

/** Lets deferred lookups start and their responses land. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

/** Answers `method` with `status` for every chat, or only for `chatId`. */
const failLookups = (method: string, status: number, chatId?: string) => {
  const apiFetch = globalThis.fetch;
  globalThis.fetch = jest.fn((input: unknown, init?: RequestInit) => {
    const failing =
      String(input).includes(`/${method}/`) &&
      (chatId === undefined || String(init?.body).includes(chatId));
    if (failing) {
      const lookups = method === 'getAvatar' ? api.avatarLookups : api.contactInfoLookups;
      lookups.push(JSON.parse(String(init?.body)).chatId);
    }
    return failing ? Promise.resolve(json({}, status)) : apiFetch(input as RequestInfo, init);
  }) as unknown as typeof fetch;
};

describe('useAvatars', () => {
  it('looks up every chat photo, recording null when there is none', async () => {
    api.avatars['111'] = 'https://i.oneme.ru/i?r=abc';

    const { store } = renderWithChats();

    await waitFor(() =>
      expect(store.getState().chats.chats.map((chat) => chat.avatarUrl)).toEqual([
        'https://i.oneme.ru/i?r=abc',
        null,
      ]),
    );
  });

  it('does not look the same photo up twice within a session', async () => {
    const { rerender } = renderWithChats();
    await waitFor(() => expect(api.avatarLookups).toHaveLength(2));

    rerender();
    await settle();

    expect(api.avatarLookups).toHaveLength(2);
  });

  it('sends each lookup once under StrictMode', async () => {
    // Every call that reaches the server spends the monthly quota.
    const Probe = () => {
      useAvatars();
      return null;
    };
    renderWithProviders(createElement(Probe), {
      preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats: CHATS } }),
    });

    await settle();
    expect(api.avatarLookups).toEqual(['111', '222']);
  });

  it('skips photos that were looked up recently', async () => {
    const checkedAt = Date.now();
    renderWithChats([
      { ...CHATS[0], avatarUrl: 'https://photo', avatarCheckedAt: checkedAt },
      { ...CHATS[1], avatarUrl: null, avatarCheckedAt: checkedAt },
    ]);

    await settle();
    expect(api.avatarLookups).toEqual([]);
  });

  it('keeps a known photo when its lookup fails', async () => {
    const PHOTO = 'https://i.oneme.ru/i?r=known';
    failLookups('getAvatar', 500, '111');

    const { store } = renderWithChats([{ ...CHATS[0], avatarUrl: PHOTO }, CHATS[1]]);

    await waitFor(() => expect(store.getState().chats.chats[1].avatarUrl).toBeNull());
    expect(store.getState().chats.chats[0].avatarUrl).toBe(PHOTO);
  });

  it("gets photos from getContactInfo once getAvatar's monthly quota is spent", async () => {
    api.avatars['111'] = 'https://photo';
    failLookups('getAvatar', 466);

    const { store } = renderWithChats();

    await waitFor(() => expect(store.getState().chats.chats[0].avatarUrl).toBe('https://photo'));
    expect(api.contactInfoLookups).toEqual(['111', '222']);
  });

  it('stops looking photos up once every quota is spent', async () => {
    failLookups('getAvatar', 466);
    failLookups('getContactInfo', 466);
    const { store } = renderWithChats();
    await waitFor(() => expect(api.avatarLookups).toHaveLength(2));
    await settle();

    act(() => {
      store.dispatch(onAddChat(NEW_CHAT));
    });
    await settle();

    expect(api.avatarLookups).toEqual(['111', '222']);
    expect(api.contactInfoLookups).toEqual(['111', '222']);
  });

  it('lets lookups in flight finish when the chat list changes', async () => {
    api.avatars['111'] = 'https://photo';
    const apiFetch = globalThis.fetch;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    globalThis.fetch = jest.fn((input: unknown, init?: RequestInit) =>
      String(input).includes('/getAvatar/')
        ? gate.then(() => apiFetch(input as RequestInfo, init))
        : apiFetch(input as RequestInfo, init),
    ) as unknown as typeof fetch;

    const { store } = renderWithChats();
    await settle();

    // A new chat landing mid-lookup used to abort the batch and re-request it.
    act(() => {
      store.dispatch(onAddChat(NEW_CHAT));
    });
    await settle();
    release();

    await waitFor(() => expect(store.getState().chats.chats[0].avatarUrl).toBe('https://photo'));
    expect(api.avatarLookups).toEqual(['111', '222', '333']);
  });

  it('does nothing when signed out', async () => {
    renderHookWithProviders(() => useAvatars());
    await settle();
    expect(api.avatarLookups).toEqual([]);
  });
});
