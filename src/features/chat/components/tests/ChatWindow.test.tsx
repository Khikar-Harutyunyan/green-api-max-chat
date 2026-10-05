import {
  act,
  screen,
  within,
  CHAT_ID,
  waitFor,
  signedInState,
  INITIAL_STATE,
  installApiMock,
  renderWithProviders,
} from '@app/test-utils';
import type { Api } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { onSelectChat } from '@features/chat/reducers/chats';

import { ChatWindow } from '../ChatWindow';

import type { Message } from '@app/types';

const CHAT = { chatId: CHAT_ID, phoneNumber: '', name: 'Arpi Meliqsetyan' };

const message = (localId: string, text: string, timestamp: number): Message => ({
  text,
  localId,
  timestamp,
  status: 'read',
  direction: 'in',
  chatId: CHAT_ID,
  idMessage: localId,
});

const HISTORY_ITEM = {
  chatId: CHAT_ID,
  type: 'incoming',
  timestamp: 1790876563,
  textMessage: 'из истории',
  typeMessage: 'textMessage',
  idMessage: '117366886462654831',
};

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

const historyCalls = () => api.methodCalls.filter((method) => method === 'getChatHistory');

const openChat = (chatId = CHAT_ID) =>
  signedInState({
    chats: { ...INITIAL_STATE.chats, chats: [CHAT, { ...CHAT, chatId: '222' }], activeChatId: chatId },
  });

describe('ChatWindow', () => {
  it('asks to pick a chat when none is open', () => {
    renderWithProviders(<ChatWindow />, { preloadedState: signedInState() });
    expect(screen.getByText(/Выберите чат или создайте новый/)).toBeInTheDocument();
  });

  it('shows the open chat with its messages', () => {
    renderWithProviders(<ChatWindow />, {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: [CHAT], activeChatId: CHAT_ID },
        messages: {
          byChat: { [CHAT_ID]: [message('a', 'первое', 1), message('b', 'второе', 2)] },
          seen: { a: true, b: true },
        },
      }),
    });

    expect(screen.getByText('Arpi Meliqsetyan')).toBeInTheDocument();
    expect(screen.getByText(`chatId ${CHAT_ID}`)).toBeInTheDocument();
    const log = within(screen.getByRole('log', { name: 'История сообщений' }));
    expect(log.getByText('первое')).toBeInTheDocument();
    expect(log.getByText('второе')).toBeInTheDocument();
  });

  it('loads the history of the open chat, saying so meanwhile', async () => {
    api.historyByChat[CHAT_ID] = [HISTORY_ITEM];
    const { store } = renderWithProviders(<ChatWindow />, { preloadedState: openChat() });
    expect(screen.getByText('Загружаем историю…')).toBeInTheDocument();

    expect(await screen.findByText('из истории')).toBeInTheDocument();
    expect(store.getState().messages.byChat[CHAT_ID]).toHaveLength(1);
  });

  it('asks for the history once, under StrictMode too', async () => {
    api.historyByChat[CHAT_ID] = [HISTORY_ITEM];
    renderWithProviders(<ChatWindow />, { preloadedState: openChat() });

    await screen.findByText('из истории');
    expect(historyCalls()).toHaveLength(1);
  });

  it('loads the history of a chat opened later, and not again on returning', async () => {
    api.historyByChat[CHAT_ID] = [HISTORY_ITEM];
    const { store } = renderWithProviders(<ChatWindow />, { preloadedState: openChat('222') });
    await screen.findByText('Сообщений пока нет. Напишите первым.');

    act(() => {
      store.dispatch(onSelectChat(CHAT_ID));
    });
    await screen.findByText('из истории');

    act(() => {
      store.dispatch(onSelectChat('222'));
    });
    act(() => {
      store.dispatch(onSelectChat(CHAT_ID));
    });
    await screen.findByText('из истории');
    expect(historyCalls()).toEqual(['getChatHistory', 'getChatHistory']);
  });

  it('invites the first message in an empty chat', async () => {
    renderWithProviders(<ChatWindow />, { preloadedState: openChat() });
    expect(await screen.findByText('Сообщений пока нет. Напишите первым.')).toBeInTheDocument();
  });

  it('loads no history while no chat is open', async () => {
    renderWithProviders(<ChatWindow />, { preloadedState: signedInState() });
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(historyCalls()).toEqual([]);
  });

  it('sends a message to the open chat and shows it immediately', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatWindow />, {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: [CHAT], activeChatId: CHAT_ID },
      }),
    });

    await user.type(screen.getByPlaceholderText('Напишите сообщение…'), 'привет{Enter}');

    expect(screen.getByText('привет')).toBeInTheDocument();
    await waitFor(() => expect(api.sent).toEqual([{ chatId: CHAT_ID, message: 'привет' }]));
    expect(await screen.findByLabelText('Отправлено')).toBeInTheDocument();
  });

  it('goes back to the chat list, keeping the chat selected', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ChatWindow />, {
      preloadedState: signedInState({
        chats: { ...INITIAL_STATE.chats, chats: [CHAT], activeChatId: CHAT_ID, isChatOpen: true },
      }),
    });

    await user.click(screen.getByRole('button', { name: 'Назад к чатам' }));

    expect(store.getState().chats).toMatchObject({ isChatOpen: false, activeChatId: CHAT_ID });
  });
});
