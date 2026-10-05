import userEvent from '@testing-library/user-event';
import { useLocation, MemoryRouter } from 'react-router-dom';
import { screen, signedInState, installApiMock, renderWithProviders } from '@app/test-utils';

import { AppRoutes } from '@app/router';

import { PATHS } from '@app/router/constants/paths';

const CurrentPath = () => <output aria-label="path">{useLocation().pathname}</output>;

const renderAt = (path: string, signedIn: boolean) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <CurrentPath />
    </MemoryRouter>,
    { preloadedState: signedIn ? signedInState() : undefined },
  );

const currentPath = () => screen.getByLabelText('path').textContent;

beforeEach(() => {
  localStorage.clear();
  installApiMock();
});

describe('AppRoutes', () => {
  it('serves the chats to a signed-in user', async () => {
    renderAt(PATHS.chats, true);
    expect(await screen.findByText('Чаты')).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.chats);
  });

  it('serves sign-in to a signed-out visitor', () => {
    renderAt(PATHS.signIn, false);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('turns a signed-out visitor away from the chats', () => {
    renderAt(PATHS.chats, false);
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.signIn);
  });

  it('moves a signed-in user off the sign-in page', async () => {
    renderAt(PATHS.signIn, true);
    expect(await screen.findByText('Чаты')).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.chats);
  });

  it('sends an unknown URL to wherever the user belongs', () => {
    renderAt('/no-such-page', false);
    expect(currentPath()).toBe(PATHS.signIn);
  });

  it('returns to sign-in on sign-out', async () => {
    renderAt(PATHS.chats, true);
    await userEvent.click(await screen.findByRole('button', { name: 'Выйти' }));
    expect(currentPath()).toBe(PATHS.signIn);
  });
});
