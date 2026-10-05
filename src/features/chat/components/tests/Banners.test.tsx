import {
  act,
  json,
  screen,
  waitFor,
  signedInState,
  installApiMock,
  renderWithProviders,
} from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { Banners } from '../Banners';
import { GreenApiError } from '@app/api/GreenApiError';

import type { Api } from '@app/test-utils';


const ONLINE = { online: true, lastError: null };

let api: Api;

beforeEach(() => {
  localStorage.clear();
  api = installApiMock();
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

const calls = (method: string) => api.methodCalls.filter((called) => called === method);

describe('Banners', () => {
  it('shows nothing when everything works', async () => {
    const { container } = renderWithProviders(<Banners {...ONLINE} />, {
      preloadedState: signedInState(),
    });
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('asks for the instance state and settings once, under StrictMode too', async () => {
    renderWithProviders(<Banners {...ONLINE} />, { preloadedState: signedInState() });
    await settle();
    expect(calls('getStateInstance')).toHaveLength(1);
    expect(calls('getSettings')).toHaveLength(1);
  });

  it('warns when the instance is not authorized', async () => {
    api.stateInstance = 'notAuthorized';
    renderWithProviders(<Banners {...ONLINE} />, { preloadedState: signedInState() });
    expect(await screen.findByText(/Инстанс не авторизован \(notAuthorized\)/)).toBeInTheDocument();
  });

  it('warns when GREEN-API cannot be reached', () => {
    renderWithProviders(
      <Banners online={false} lastError={new GreenApiError('x', 0, '')} />,
      { preloadedState: signedInState() },
    );
    expect(screen.getByText(/Нет связи с GREEN-API, пробуем/)).toBeInTheDocument();
    expect(screen.getByText('GREEN-API не отвечает')).toBeInTheDocument();
  });

  it('enables missing notifications on request, without reading the settings back', async () => {
    delete api.settings.incomingWebhook;
    renderWithProviders(<Banners {...ONLINE} />, { preloadedState: signedInState() });
    expect(await screen.findByText(/выключены уведомления \(incomingWebhook\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Включить' }));

    await waitFor(() => expect(screen.queryByText(/выключены уведомления/)).not.toBeInTheDocument());
    expect(api.settings.incomingWebhook).toBe('yes');
    expect(calls('getSettings')).toHaveLength(1);
  });

  it('explains why enabling notifications failed', async () => {
    delete api.settings.incomingWebhook;
    const apiFetch = globalThis.fetch;
    globalThis.fetch = jest.fn((input: RequestInfo, init?: RequestInit) =>
      String(input).includes('/setSettings/') ? Promise.resolve(json({}, 500)) : apiFetch(input, init),
    ) as unknown as typeof fetch;
    renderWithProviders(<Banners {...ONLINE} />, { preloadedState: signedInState() });

    await userEvent.click(await screen.findByRole('button', { name: 'Включить' }));

    expect(await screen.findByText('Ошибка GREEN-API (HTTP 500)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Включить' })).toBeEnabled();
  });
});
