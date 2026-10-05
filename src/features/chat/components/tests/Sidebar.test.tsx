import {
  act,
  screen,
  within,
  fireEvent,
  CREDENTIALS,
  signedInState,
  INITIAL_STATE,
  installApiMock,
  renderWithProviders,
} from '@app/test-utils';
import type { Api } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { Sidebar } from '../Sidebar';

import * as chatPreview from '@features/chat/utils/getChatPreview';

import { onReceiveMessage } from '@features/chat/reducers/messages';

const CHATS = [
  { chatId: '111', phoneNumber: '', name: 'Первый' },
  { chatId: '222', phoneNumber: '', name: 'Второй' },
];

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

describe('Sidebar', () => {
  it('shows the instance id and an empty list', () => {
    renderWithProviders(<Sidebar />, { preloadedState: signedInState() });
    expect(screen.getByText(CREDENTIALS.idInstance)).toBeInTheDocument();
    expect(screen.getByText('Пока нет чатов')).toBeInTheDocument();
  });

  it("adds the account's existing chats, asking once under StrictMode too", async () => {
    // getChats came back 429 when StrictMode's throwaway mount had asked first.
    api.chats.push({ chatId: '333', name: 'С аккаунта', type: 'user', phoneNumber: 0 });
    const { store } = renderWithProviders(<Sidebar />, {
      preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats: [CHATS[0]] } }),
    });

    expect(await screen.findByText('С аккаунта')).toBeInTheDocument();
    expect(screen.getByText('Первый')).toBeInTheDocument();
    expect(store.getState().chats.activeChatId).toBe('333');
    expect(api.methodCalls.filter((method) => method === 'getChats')).toHaveLength(1);
  });

  it('lists the chats with their last message', () => {
    renderWithProviders(<Sidebar />, {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: CHATS },
        messages: {
          byChat: {
            '222': [
              {
                localId: 'a',
                timestamp: 1,
                chatId: '222',
                status: 'read',
                idMessage: 'a',
                direction: 'in',
                text: 'последнее',
              },
            ],
          },
          seen: { a: true },
        },
      }),
    });

    const list = within(screen.getByRole('list'));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText('последнее')).toBeInTheDocument();
  });

  it('re-renders only the chat that got a message', () => {
    const { store } = renderWithProviders(<Sidebar />, {
      preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats: CHATS } }),
    });
    const preview = jest.spyOn(chatPreview, 'getChatPreview');

    act(() => {
      store.dispatch(
        onReceiveMessage({ kind: 'incoming', chatId: '222', idMessage: 'm', text: 'привет', timestamp: 2 }),
      );
    });

    const rendered = preview.mock.calls.map(([text]) => text);
    expect(rendered).toContain('привет');
    expect(rendered).not.toContain(undefined);
  });

  it('opens a chat when it is clicked', async () => {
    const { store } = renderWithProviders(<Sidebar />, {
      preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats: CHATS } }),
    });

    await userEvent.click(screen.getByRole('button', { name: /Второй/ }));
    expect(store.getState().chats.activeChatId).toBe('222');
    expect(store.getState().chats.isChatOpen).toBe(true);
  });

  it('forgets a photo that fails to load, so it is looked up again', () => {
    const chats = [{ ...CHATS[0], avatarUrl: 'https://expired', avatarCheckedAt: 1 }];
    const { container, store } = renderWithProviders(<Sidebar />, {
      preloadedState: signedInState({ chats: { ...INITIAL_STATE.chats, chats } }),
    });

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(store.getState().chats.chats[0].avatarUrl).toBeUndefined();
  });

  it('signs out', async () => {
    localStorage.setItem('max-chat.credentials', JSON.stringify(CREDENTIALS));
    const { store } = renderWithProviders(<Sidebar />, { preloadedState: signedInState() });

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }));

    expect(store.getState().auth.credentials).toBeNull();
    expect(localStorage.getItem('max-chat.credentials')).toBeNull();
  });
});
