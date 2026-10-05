import {
  json,
  PHONE,
  screen,
  waitFor,
  CHAT_ID,
  signedInState,
  installApiMock,
  renderWithProviders,
} from '@app/test-utils'; import userEvent from '@testing-library/user-event';

import { logger } from '@app/services/logger';

import { NewChatForm } from '../NewChatForm';


beforeEach(() => {
  localStorage.clear();
  installApiMock();
});

const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '+ Новый чат' }));
};

describe('NewChatForm', () => {
  it('opens and cancels the phone form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewChatForm />, { preloadedState: signedInState() });

    await openForm(user);
    expect(screen.getByPlaceholderText('79001234567')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.getByRole('button', { name: '+ Новый чат' })).toBeInTheDocument();
  });

  it('creates the chat, opens it and collapses the form', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<NewChatForm />, { preloadedState: signedInState() });

    await openForm(user);
    await user.type(screen.getByPlaceholderText('79001234567'), PHONE);
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => expect(store.getState().chats.activeChatId).toBe(CHAT_ID));
    expect(store.getState().chats.chats).toEqual([
      { chatId: CHAT_ID, phoneNumber: PHONE, name: `+${PHONE}` },
    ]);
    expect(screen.getByRole('button', { name: '+ Новый чат' })).toBeInTheDocument();
  });

  it('rejects a number that is too short without calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewChatForm />, { preloadedState: signedInState() });

    await openForm(user);
    await user.type(screen.getByPlaceholderText('79001234567'), '123');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText(/в международном формате/)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reports a number that is not registered in MAX', async () => {
    const user = userEvent.setup();
    globalThis.fetch = jest.fn(() => Promise.resolve(json({ exist: false }))) as unknown as typeof fetch;
    renderWithProviders(<NewChatForm />, { preloadedState: signedInState() });

    await openForm(user);
    await user.type(screen.getByPlaceholderText('79001234567'), '79990000000');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Этот номер не зарегистрирован в MAX')).toBeInTheDocument();
  });

  it('explains a spent checkAccount quota', async () => {
    const user = userEvent.setup();
    const invokeStatus = { used: 100, total: 100, method: 'checkAccount', status: 'QUOTE_EXCEEDED' };
    globalThis.fetch = jest.fn(() => Promise.resolve(json({ invokeStatus }, 466))) as unknown as typeof fetch;
    renderWithProviders(<NewChatForm />, { preloadedState: signedInState() });

    await openForm(user);
    await user.type(screen.getByPlaceholderText('79001234567'), '79990000000');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Исчерпан месячный лимит метода checkAccount (100 из 100)')).toBeInTheDocument();
    expect(logger.warn).toHaveBeenCalledWith('checkAccount request failed', expect.anything());
    expect(jest.mocked(logger.warn).mock.calls.flat().map(String).join('\n')).not.toContain('79990000000');
  });
});
