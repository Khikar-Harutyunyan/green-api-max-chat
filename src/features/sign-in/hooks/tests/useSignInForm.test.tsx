import userEvent from '@testing-library/user-event';
import { json, screen, waitFor, CREDENTIALS, installApiMock, renderWithProviders } from '@app/test-utils';

import { useSignInForm } from '@features/sign-in/hooks/useSignInForm';

import { SIGN_IN_MESSAGES } from '@features/sign-in/constants/signInValidation';

/** The hook hands out props for real inputs, so it is exercised through them. */
const Harness = () => {
  const form = useSignInForm();
  return (
    <form onSubmit={form.onSubmit}>
      <input aria-label="idInstance" {...form.fields.idInstance} />
      <input aria-label="apiTokenInstance" {...form.fields.apiTokenInstance} />
      <input aria-label="apiUrl" {...form.fields.apiUrl} />
      <p>{form.errors.apiUrl?.message}</p>
      <p>{form.errors.idInstance?.message}</p>
      <p>{form.errors.apiTokenInstance?.message}</p>
      <button type="submit" disabled={!form.canSubmit || form.isSubmitting}>
        {form.isSubmitting ? 'busy' : 'submit'}
      </button>
      {form.submitError && <p role="alert">{form.submitError}</p>}
    </form>
  );
};

const field = (name: string) => screen.getByLabelText(name);

const fillIn = async (idInstance = '310022752991', token = 'test-token') => {
  await userEvent.type(field('idInstance'), idInstance);
  await userEvent.type(field('apiTokenInstance'), token);
};

beforeEach(() => {
  localStorage.clear();
  installApiMock();
});

describe('useSignInForm', () => {
  it('derives apiUrl from idInstance', async () => {
    renderWithProviders(<Harness />);
    expect(field('apiUrl')).toHaveValue('');

    await userEvent.type(field('idInstance'), '310022752991');
    expect(field('apiUrl')).toHaveValue('https://3100.api.green-api.com');
  });

  it('stops following idInstance once apiUrl is typed by hand', async () => {
    renderWithProviders(<Harness />);
    await userEvent.type(field('apiUrl'), 'https://custom.example.com');
    await userEvent.type(field('idInstance'), '310022752991');
    expect(field('apiUrl')).toHaveValue('https://custom.example.com');
  });

  it('follows idInstance again once apiUrl is emptied', async () => {
    renderWithProviders(<Harness />);
    await userEvent.type(field('apiUrl'), 'https://custom.example.com');
    await userEvent.clear(field('apiUrl'));

    await userEvent.type(field('idInstance'), '310022752991');
    expect(field('apiUrl')).toHaveValue('https://3100.api.green-api.com');
  });

  it('requires apiUrl to be an http(s) address', async () => {
    renderWithProviders(<Harness />);

    await userEvent.type(field('apiUrl'), '3100.api.green-api.com');
    expect(await screen.findByText(SIGN_IN_MESSAGES.apiUrlFormat)).toBeInTheDocument();

    await userEvent.clear(field('apiUrl'));
    expect(await screen.findByText(SIGN_IN_MESSAGES.apiUrlRequired)).toBeInTheDocument();
  });

  it('shows no apiUrl error while idInstance is still too short to fill it', async () => {
    renderWithProviders(<Harness />);
    await userEvent.type(field('idInstance'), '31');
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.queryByText(SIGN_IN_MESSAGES.apiUrlRequired)).not.toBeInTheDocument();
  });

  it('can only submit once every field is valid', async () => {
    renderWithProviders(<Harness />);
    const submit = screen.getByRole('button');
    await waitFor(() => expect(submit).toBeDisabled());

    await fillIn();
    await waitFor(() => expect(submit).toBeEnabled());

    await userEvent.type(field('idInstance'), 'x');
    await waitFor(() => expect(submit).toBeDisabled());
  });

  it('cannot submit while idInstance is too short to give an apiUrl', async () => {
    renderWithProviders(<Harness />);
    await fillIn('310');
    // Valid digits, but no apiUrl to send them to yet.
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
  });

  it('requires idInstance, as digits only', async () => {
    renderWithProviders(<Harness />);

    await userEvent.type(field('idInstance'), '3100a');
    expect(await screen.findByText(SIGN_IN_MESSAGES.idInstanceDigits)).toBeInTheDocument();

    await userEvent.clear(field('idInstance'));
    expect(await screen.findByText(SIGN_IN_MESSAGES.idInstanceRequired)).toBeInTheDocument();
  });

  it('requires a token that is not just spaces', async () => {
    renderWithProviders(<Harness />);
    await userEvent.type(field('apiTokenInstance'), '   ');
    expect(await screen.findByText(SIGN_IN_MESSAGES.tokenRequired)).toBeInTheDocument();
  });

  it('signs in with trimmed credentials', async () => {
    const { store } = renderWithProviders(<Harness />);
    await fillIn(' 310022752991 ', ' test-token ');
    await userEvent.clear(field('apiUrl'));
    await userEvent.type(field('apiUrl'), ' https://3100.api.green-api.com/ ');

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(store.getState().auth.credentials).toEqual(CREDENTIALS));
  });

  it('exposes a readable error when sign-in fails, and clears it on retry', async () => {
    globalThis.fetch = jest.fn(() => Promise.resolve(json({}, 401))) as unknown as typeof fetch;
    renderWithProviders(<Harness />);
    await fillIn('310022752991', 'wrong');

    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверные idInstance или apiTokenInstance',
    );

    installApiMock();
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('points at apiUrl when nothing answers there', async () => {
    // What a browser reports for a host that does not exist.
    globalThis.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch;
    renderWithProviders(<Harness />);
    await fillIn('999912345678');

    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось подключиться по apiUrl — проверьте apiUrl и idInstance',
    );
  });
});
