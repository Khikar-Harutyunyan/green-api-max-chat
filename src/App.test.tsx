import {
  act,
  json,
  PHONE,
  screen,
  within,
  CHAT_ID,
  SENT_ID,
  waitFor,
  fireEvent,
  installApiMock,
  renderWithProviders,
} from '@app/test-utils';
import type { Api } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { App } from './App';

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('230022752567'), '310022752991');
  await user.type(screen.getByPlaceholderText('Токен из личного кабинета'), 'test-token');
  await user.click(screen.getByRole('button', { name: 'Войти' }));
  await screen.findByText('Чаты');
}

async function openChat(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '+ Новый чат' }));
  await user.type(screen.getByPlaceholderText('79001234567'), PHONE);
  await user.click(screen.getByRole('button', { name: 'Создать' }));
  await screen.findByText(`chatId ${CHAT_ID}`);
}

async function findAvatarImage(container: HTMLElement): Promise<HTMLImageElement> {
  return waitFor(() => {
    const image = container.querySelector('img');
    if (!image) throw new Error('avatar image not rendered yet');
    return image;
  });
}

describe('App', () => {
  it('gives sign-in and the chats their own URLs', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/');

    renderWithProviders(<App />);
    expect(window.location.pathname).toBe('/sign-in');

    await signIn(user);
    expect(window.location.pathname).toBe('/');

    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(window.location.pathname).toBe('/sign-in');
  });

  it('apiUrl is prefilled from idInstance but stays editable', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    const apiUrlField = screen.getByPlaceholderText('https://2300.api.green-api.com');
    expect(apiUrlField).toHaveValue('');

    await user.type(screen.getByPlaceholderText('230022752567'), '310022752991');
    expect(apiUrlField).toHaveValue('https://3100.api.green-api.com');

    // Editing by hand must stop the autofill from overwriting it.
    await user.clear(apiUrlField);
    await user.type(apiUrlField, 'https://custom.example.com');
    await user.type(screen.getByPlaceholderText('230022752567'), '9');
    expect(apiUrlField).toHaveValue('https://custom.example.com');
  });

  it('rejects an instance that is not authorized', async () => {
    const user = userEvent.setup();
    globalThis.fetch = jest.fn(() =>
      Promise.resolve(json({ stateInstance: 'notAuthorized' })),
    ) as unknown as typeof fetch;

    renderWithProviders(<App />);
    await user.type(screen.getByPlaceholderText('230022752567'), '310022752991');
    await user.type(screen.getByPlaceholderText('Токен из личного кабинета'), 'test-token');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText(/Инстанс не авторизован/)).toBeInTheDocument();
    expect(screen.queryByText('Чаты')).not.toBeInTheDocument();
  });

  it('reports a number that is not registered in MAX', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await signIn(user);

    const realFetch = globalThis.fetch;
    globalThis.fetch = jest.fn((input: unknown, init?: RequestInit) =>
      String(input).includes('/checkAccount/')
        ? Promise.resolve(json({ exist: false }))
        : (realFetch as (i: unknown, n?: RequestInit) => Promise<Response>)(input, init),
    ) as unknown as typeof fetch;

    await user.click(screen.getByRole('button', { name: '+ Новый чат' }));
    await user.type(screen.getByPlaceholderText('79001234567'), '79990000000');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Этот номер не зарегистрирован в MAX')).toBeInTheDocument();
  });

  it('full round trip: send, echo, status, reply', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await signIn(user);
    await openChat(user);

    // Scoped to the history: the sidebar also shows a preview of the same text.
    const history = within(screen.getByRole('log', { name: 'История сообщений' }));

    // --- send -------------------------------------------------------------
    await user.type(screen.getByPlaceholderText('Напишите сообщение…'), 'test from api{Enter}');

    // Rendered optimistically, before the server confirms anything.
    expect(history.getByText('test from api')).toBeInTheDocument();
    await waitFor(() => expect(api.sent).toEqual([{ chatId: CHAT_ID, message: 'test from api' }]));

    // --- echo: must NOT duplicate the bubble -------------------------------
    act(() => {
      api.emit({
        typeWebhook: 'outgoingAPIMessageReceived',
        timestamp: 1790860382,
        idMessage: SENT_ID,
        senderData: { chatId: CHAT_ID, sender: '502194430', senderName: 'Khikar' },
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'test from api' },
        },
      });
    });

    await waitFor(() => expect(history.getAllByText('test from api')).toHaveLength(1));

    // --- delivery status drives the ticks ----------------------------------
    act(() => {
      api.emit({
        typeWebhook: 'outgoingMessageStatus',
        chatId: CHAT_ID,
        timestamp: 1790860390,
        idMessage: SENT_ID,
        status: 'read',
      });
    });

    expect(await history.findByLabelText('Прочитано')).toBeInTheDocument();

    // --- the other side replies --------------------------------------------
    act(() => {
      api.emit({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1790860689,
        idMessage: '117365846173366795',
        senderData: {
          chatId: CHAT_ID,
          sender: CHAT_ID,
          senderName: 'Arpi Meliqsetyan',
        },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'msg' } },
      });
    });

    expect(await history.findByText('msg')).toBeInTheDocument();
  });

  it('an echo overtaking the send response does not duplicate the bubble', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await signIn(user);
    await openChat(user);
    const history = within(screen.getByRole('log', { name: 'История сообщений' }));

    // The poller runs concurrently with sendMessage, so the echo really can land
    // first. In that window idMessage is still unknown and dedup-by-id cannot
    // help — the echo has to be matched to the pending bubble by chat and text.
    api.holdSend();
    await user.type(screen.getByPlaceholderText('Напишите сообщение…'), 'гонка{Enter}');
    await waitFor(() => expect(api.sent).toHaveLength(1));

    act(() => {
      api.emit({
        typeWebhook: 'outgoingAPIMessageReceived',
        timestamp: 1790860382,
        idMessage: SENT_ID,
        senderData: { chatId: CHAT_ID, sender: '502194430', senderName: 'Khikar' },
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'гонка' },
        },
      });
    });

    await waitFor(() => expect(history.getAllByText('гонка')).toHaveLength(1));

    await act(async () => {
      api.releaseSend();
    });

    expect(history.getAllByText('гонка')).toHaveLength(1);
  });

  it('chats that already exist on the account show up after login', async () => {
    const user = userEvent.setup();
    // Shape taken from a live getChats response, including the bot entry.
    api.chats.push(
      { chatId: '462217484', name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 },
      { chatId: '502194430', name: 'Избранное', type: 'user', phoneNumber: 0 },
      { chatId: '543835', name: 'MAX', type: 'bot', phoneNumber: 0 },
    );

    renderWithProviders(<App />);
    await signIn(user);

    const list = within(await screen.findByRole('list'));
    expect(await list.findByText('Arpi Meliqsetyan')).toBeInTheDocument();
    expect(list.getByText('Избранное')).toBeInTheDocument();
    expect(list.getByText('MAX')).toBeInTheDocument();
    expect(screen.queryByText('Пока нет чатов')).not.toBeInTheDocument();
  });

  it('creating a chat by phone does not duplicate one already on the account', async () => {
    const user = userEvent.setup();
    // The account already has this chat; checkAccount resolves the typed number
    // to the very same chatId.
    api.chats.push({ chatId: CHAT_ID, name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 });

    renderWithProviders(<App />);
    await signIn(user);

    const list = within(await screen.findByRole('list'));
    expect(await list.findByText('Arpi Meliqsetyan')).toBeInTheDocument();
    expect(list.getAllByRole('listitem')).toHaveLength(1);

    await openChat(user);

    // Still one entry, and it keeps the account's name rather than reverting to
    // the raw phone number.
    expect(list.getAllByRole('listitem')).toHaveLength(1);
    expect(list.getByText('Arpi Meliqsetyan')).toBeInTheDocument();
  });

  it('opening a chat loads its past messages, oldest first', async () => {
    const user = userEvent.setup();
    api.chats.push({ chatId: CHAT_ID, name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 });

    // Verbatim shape from a live getChatHistory, including its newest-first order
    // and the top-level textMessage that neither webhook form has.
    api.historyByChat[CHAT_ID] = [
      {
        type: 'incoming',
        idMessage: '117366886462654831',
        timestamp: 1790876563,
        typeMessage: 'textMessage',
        chatId: CHAT_ID,
        textMessage: 'Hi',
        senderName: 'Arpi Meliqsetyan',
      },
      {
        type: 'outgoing',
        idMessage: '1790860411019',
        timestamp: 1790860411,
        typeMessage: 'extendedTextMessage',
        chatId: CHAT_ID,
        textMessage: 'message from terminal hohoho',
        extendedTextMessage: { text: 'message from terminal hohoho' },
        statusMessage: 'read',
      },
      {
        type: 'outgoing',
        idMessage: SENT_ID,
        timestamp: 1790860382,
        typeMessage: 'extendedTextMessage',
        chatId: CHAT_ID,
        textMessage: 'test from api',
        extendedTextMessage: { text: 'test from api' },
        statusMessage: 'read',
      },
    ];

    renderWithProviders(<App />);
    await signIn(user);

    const log = await screen.findByRole('log', { name: 'История сообщений' });
    expect(await within(log).findByText('test from api')).toBeInTheDocument();

    // Re-sorted into chronological order despite arriving newest-first.
    const rendered = Array.from(log.querySelectorAll('.text')).map((n) => n.textContent);
    expect(rendered).toEqual(['test from api', 'message from terminal hohoho', 'Hi']);

    // statusMessage drives the ticks for restored outgoing messages.
    expect(within(log).getAllByLabelText('Прочитано')).toHaveLength(2);
  });

  it('history does not duplicate a message already received live', async () => {
    const user = userEvent.setup();
    api.chats.push({ chatId: CHAT_ID, name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 });
    api.historyByChat[CHAT_ID] = [
      {
        type: 'incoming',
        idMessage: '117365846173366795',
        timestamp: 1790860689,
        typeMessage: 'textMessage',
        chatId: CHAT_ID,
        textMessage: 'msg',
        senderName: 'Arpi Meliqsetyan',
      },
    ];

    renderWithProviders(<App />);
    await signIn(user);

    const log = await screen.findByRole('log', { name: 'История сообщений' });
    expect(await within(log).findByText('msg')).toBeInTheDocument();

    // The very same message also arrives through the notification queue.
    act(() => {
      api.emit({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1790860689,
        idMessage: '117365846173366795',
        senderData: { chatId: CHAT_ID, sender: CHAT_ID, senderName: 'Arpi Meliqsetyan' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'msg' } },
      });
    });

    // A later message proves the queue drained past the duplicate, so the count
    // below is measured after it was processed rather than before.
    act(() => {
      api.emit({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1790860700,
        idMessage: '117365846173366999',
        senderData: { chatId: CHAT_ID, sender: CHAT_ID, senderName: 'Arpi Meliqsetyan' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'второе' } },
      });
    });

    expect(await within(log).findByText('второе')).toBeInTheDocument();
    expect(within(log).getAllByText('msg')).toHaveLength(1);
  });

  it('history loads after a reload, with a chat already active at mount', async () => {
    // A restored session makes activeChatId non-null during the very first render,
    // so the history effect runs during mount — where StrictMode double-invokes it.
    // Any "already fetched" guard that is not released on cleanup silently skips
    // the remount's fetch and the conversation stays blank.
    localStorage.setItem(
      'max-chat.credentials',
      JSON.stringify({
        apiUrl: 'https://3100.api.green-api.com',
        idInstance: '310022752991',
        apiTokenInstance: 'test-token',
      }),
    );
    localStorage.setItem(
      'max-chat.chats.310022752991',
      JSON.stringify([{ chatId: CHAT_ID, phoneNumber: PHONE, name: 'Arpi Meliqsetyan' }]),
    );
    api.historyByChat[CHAT_ID] = [
      {
        type: 'incoming',
        idMessage: '117366886462654831',
        timestamp: 1790876563,
        typeMessage: 'textMessage',
        chatId: CHAT_ID,
        textMessage: 'восстановлено',
        senderName: 'Arpi Meliqsetyan',
      },
    ];

    renderWithProviders(<App />);

    const log = await screen.findByRole('log', { name: 'История сообщений' });
    expect(await within(log).findByText('восстановлено')).toBeInTheDocument();
  });

  it('reopens the chat that was selected before the reload', async () => {
    const user = userEvent.setup();
    api.chats.push(
      { chatId: '111', name: 'Первый', type: 'user', phoneNumber: 0 },
      { chatId: '222', name: 'Второй', type: 'user', phoneNumber: 0 },
    );

    const first = renderWithProviders(<App />);
    await signIn(user);
    await screen.findByText('Второй');

    // Open the second chat — not the one that would be chosen by default.
    await user.click(screen.getByRole('button', { name: /Второй/ }));
    expect(await screen.findByText('chatId 222')).toBeInTheDocument();

    first.unmount();
    renderWithProviders(<App />);

    expect(await screen.findByText('chatId 222')).toBeInTheDocument();
  });

  it('falls back to the first chat when the remembered one no longer exists', async () => {
    localStorage.setItem(
      'max-chat.credentials',
      JSON.stringify({
        apiUrl: 'https://3100.api.green-api.com',
        idInstance: '310022752991',
        apiTokenInstance: 'test-token',
      }),
    );
    localStorage.setItem(
      'max-chat.chats.310022752991',
      JSON.stringify([{ chatId: '111', phoneNumber: '', name: 'Первый' }]),
    );
    // Points at a chat that has since been removed from the account.
    localStorage.setItem('max-chat.activeChat.310022752991', JSON.stringify('999'));
    api.chats.push({ chatId: '111', name: 'Первый', type: 'user', phoneNumber: 0 });

    renderWithProviders(<App />);

    expect(await screen.findByText('chatId 111')).toBeInTheDocument();
  });

  it('shows the contact photo, and initials when there is none', async () => {
    const user = userEvent.setup();
    api.chats.push(
      { chatId: '111', name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 },
      { chatId: '222', name: 'Gegham Xachatryan', type: 'user', phoneNumber: 0 },
    );
    api.avatars['111'] = 'https://i.oneme.ru/i?r=abc';
    // '222' is absent, i.e. the contact has no photo set — a normal answer.

    renderWithProviders(<App />);
    await signIn(user);

    const listEl = await screen.findByRole('list');
    const photo = await findAvatarImage(listEl);
    expect(photo).toHaveAttribute('src', 'https://i.oneme.ru/i?r=abc');
    expect(photo).toHaveAttribute('alt', '');

    // The photoless contact falls back to initials from both name words.
    expect(within(listEl).getByText('GX')).toBeInTheDocument();
    // Exactly one image: the second contact must not render a broken one.
    expect(listEl.querySelectorAll('img')).toHaveLength(1);
  });

  it('falls back to initials when the photo URL fails to load', async () => {
    const user = userEvent.setup();
    api.chats.push({ chatId: '111', name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 });
    api.avatars['111'] = 'https://i.oneme.ru/i?r=expired';

    renderWithProviders(<App />);
    await signIn(user);

    const listEl = await screen.findByRole('list');
    const photo = await findAvatarImage(listEl);

    // These URLs are signed and do expire.
    fireEvent.error(photo);

    expect(listEl.querySelector('img')).toBeNull();
    expect(within(listEl).getByText('AM')).toBeInTheDocument();
  });

  it('does not look the same photo up twice within a session', async () => {
    const user = userEvent.setup();
    // A contact with no photo is the case that matters: there is no URL stored
    // afterwards, so only the session guard stops this re-requesting on every
    // re-render.
    api.chats.push({ chatId: '222', name: 'Gegham Xachatryan', type: 'user', phoneNumber: 0 });

    renderWithProviders(<App />);
    await signIn(user);

    const listEl = await screen.findByRole('list');
    await waitFor(() => expect(api.avatarLookups).toContain('222'));
    const afterFirstLoad = api.avatarLookups.length;

    // Force unrelated re-renders: an incoming message rewrites chat and message
    // state, which is what re-runs the lookup effect with a fresh chats array.
    api.emit({
      typeWebhook: 'incomingMessageReceived',
      senderData: { chatId: '222', senderName: 'Gegham Xachatryan' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'hi' } },
    });
    await within(listEl).findByText('hi');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(api.avatarLookups).toHaveLength(afterFirstLoad);
  });

  it('picks up a photo the contact set after they were first seen, a day later', async () => {
    const user = userEvent.setup();
    api.chats.push({ chatId: '111', name: 'Arpi Meliqsetyan', type: 'user', phoneNumber: 0 });
    // No photo on the account yet, so the first session can only show initials.

    const first = renderWithProviders(<App />);
    await signIn(user);
    expect(await within(await screen.findByRole('list')).findByText('AM')).toBeInTheDocument();
    await waitFor(() => expect(api.avatarLookups).toEqual(['111']));
    first.unmount();

    // They set one in the mobile app.
    api.avatars['111'] = 'https://i.oneme.ru/i?r=abc';

    // getAvatar has a monthly quota, so a same-day reload trusts the stored answer…
    const second = renderWithProviders(<App />);
    expect(await within(await screen.findByRole('list')).findByText('AM')).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    expect(api.avatarLookups).toEqual(['111']);
    second.unmount();

    // …but "no photo" is not final: a day later it is checked again.
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000);
    try {
      renderWithProviders(<App />);
      const photo = await findAvatarImage(await screen.findByRole('list'));
      expect(photo).toHaveAttribute('src', 'https://i.oneme.ru/i?r=abc');
    } finally {
      clock.mockRestore();
    }
  });

  it('an incoming message from an unknown number creates the chat', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await signIn(user);

    act(() => {
      api.emit({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1790860689,
        idMessage: '117365846173366796',
        senderData: { chatId: '999111222', sender: '999111222', senderName: 'Незнакомец' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'привет' } },
      });
    });

    const list = await screen.findByRole('list');
    expect(await within(list).findByText('Незнакомец')).toBeInTheDocument();
  });

  it('warns when the instance cannot deliver notifications', async () => {
    const user = userEvent.setup();
    delete api.settings.incomingWebhook;

    renderWithProviders(<App />);
    await signIn(user);

    expect(await screen.findByText(/выключены уведомления/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Включить' })).toBeInTheDocument();
  });

  it('stays signed in after a reload', async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<App />);
    await signIn(user);
    await openChat(user);
    await user.type(screen.getByPlaceholderText('Напишите сообщение…'), 'сохрани меня{Enter}');
    await waitFor(() => expect(api.sent).toHaveLength(1));

    first.unmount();
    renderWithProviders(<App />);

    // Straight back into the chat list, no login screen.
    expect(await screen.findByText('Чаты')).toBeInTheDocument();
    expect(await screen.findByText('сохрани меня')).toBeInTheDocument();
  });
});

describe('App sign-out', () => {
  it('returns to the login screen and stays there after a reload', async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<App />);
    await signIn(user);

    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(await screen.findByRole('button', { name: 'Войти' })).toBeInTheDocument();

    first.unmount();
    renderWithProviders(<App />);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });
});
