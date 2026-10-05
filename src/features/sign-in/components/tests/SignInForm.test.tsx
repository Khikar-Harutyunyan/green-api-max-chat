import userEvent from '@testing-library/user-event';
import { json, screen, waitFor, CREDENTIALS, installApiMock, renderWithProviders } from '@app/test-utils';

import { SignInForm } from '../SignInForm';

import { SIGN_IN_MESSAGES } from '@features/sign-in/constants/signInValidation';

beforeEach(() => {
  localStorage.clear();
  installApiMock();
});

const fillIn = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText('230022752567'), CREDENTIALS.idInstance);
  await user.type(screen.getByPlaceholderText('Токен из личного кабинета'), 'test-token');
};

describe('SignInForm', () => {
  it('keeps the submit button disabled until the form is filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled();

    await fillIn(user);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
  });

  it('prefills apiUrl from idInstance but keeps it editable', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    const apiUrlField = screen.getByPlaceholderText('https://2300.api.green-api.com');
    expect(apiUrlField).toBeEnabled();

    await user.type(screen.getByPlaceholderText('230022752567'), '310022752991');
    expect(apiUrlField).toHaveValue('https://3100.api.green-api.com');

    await user.clear(apiUrlField);
    await user.type(apiUrlField, 'https://custom.example.com');
    await user.type(screen.getByPlaceholderText('230022752567'), '9');
    expect(apiUrlField).toHaveValue('https://custom.example.com');
  });

  it('explains an apiUrl that is not an address', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    const apiUrlField = screen.getByPlaceholderText('https://2300.api.green-api.com');

    await user.type(apiUrlField, 'not a url');
    expect(apiUrlField).toHaveAccessibleDescription(SIGN_IN_MESSAGES.apiUrlFormat);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled();
  });

  it('explains an idInstance that is not a number, or is missing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);
    const idInstanceField = screen.getByPlaceholderText('230022752567');

    await user.type(idInstanceField, '3100a');
    expect(await screen.findByText('idInstance состоит только из цифр')).toBeInTheDocument();
    expect(idInstanceField).toHaveAttribute('aria-invalid', 'true');
    expect(idInstanceField).toHaveAccessibleDescription('idInstance состоит только из цифр');
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled();

    await user.clear(idInstanceField);
    expect(await screen.findByText('Введите idInstance')).toBeInTheDocument();
  });

  it('explains a missing token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />);

    await user.type(screen.getByPlaceholderText('Токен из личного кабинета'), '   ');
    expect(await screen.findByText('Введите apiTokenInstance')).toBeInTheDocument();
  });

  it('signs in and remembers the credentials', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<SignInForm />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(store.getState().auth.credentials).toEqual(CREDENTIALS));
    expect(JSON.parse(localStorage.getItem('max-chat.credentials') as string)).toEqual(CREDENTIALS);
  });

  it('rejects an instance that is not authorized', async () => {
    const user = userEvent.setup();
    globalThis.fetch = jest.fn(() =>
      Promise.resolve(json({ stateInstance: 'notAuthorized' })),
    ) as unknown as typeof fetch;
    const { store } = renderWithProviders(<SignInForm />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText(/Инстанс не авторизован/)).toBeInTheDocument();
    expect(store.getState().auth.credentials).toBeNull();
  });

  it('explains wrong credentials', async () => {
    const user = userEvent.setup();
    globalThis.fetch = jest.fn(() => Promise.resolve(json({}, 401))) as unknown as typeof fetch;
    renderWithProviders(<SignInForm />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверные idInstance или apiTokenInstance')).toBeInTheDocument();
  });
});
