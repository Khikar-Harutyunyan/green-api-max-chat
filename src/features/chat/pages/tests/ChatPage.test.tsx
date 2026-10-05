import type { Api } from '@app/test-utils';
import { screen, CREDENTIALS, signedInState, installApiMock, renderWithProviders } from '@app/test-utils';

import { ChatPage } from '../ChatPage';

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

describe('ChatPage', () => {
  it('shows the sidebar and an empty chat pane', async () => {
    renderWithProviders(<ChatPage />, { preloadedState: signedInState() });

    expect(screen.getByText('Чаты')).toBeInTheDocument();
    expect(screen.getByText(CREDENTIALS.idInstance)).toBeInTheDocument();
    expect(screen.getByText(/Выберите чат или создайте новый/)).toBeInTheDocument();
    expect(await screen.findByText('Пока нет чатов')).toBeInTheDocument();
  });

  it('loads the account chats on mount', async () => {
    api.chats.push({ chatId: '111', name: 'Первый', type: 'user', phoneNumber: 0 });
    renderWithProviders(<ChatPage />, { preloadedState: signedInState() });

    expect(await screen.findByText('chatId 111')).toBeInTheDocument();
  });

  it('warns when the instance cannot deliver notifications', async () => {
    delete api.settings.stateWebhook;
    renderWithProviders(<ChatPage />, { preloadedState: signedInState() });

    expect(await screen.findByText(/выключены уведомления \(stateWebhook\)/)).toBeInTheDocument();
  });
});
