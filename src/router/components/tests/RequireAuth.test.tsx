import { Route, Routes, useLocation, MemoryRouter } from 'react-router-dom';
import { screen, signedInState, renderWithProviders } from '@app/test-utils';

import { RequireAuth } from '../RequireAuth';

import { PATHS } from '@app/router/constants/paths';

const SignInProbe = () => {
  const state = useLocation().state as { from?: { pathname: string } } | null;
  return <p>sign-in, from {state?.from?.pathname}</p>;
};

const renderAt = (signedIn: boolean) =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/private" element={<p>private page</p>} />
        </Route>
        <Route path={PATHS.signIn} element={<SignInProbe />} />
      </Routes>
    </MemoryRouter>,
    { preloadedState: signedIn ? signedInState() : undefined },
  );

beforeEach(() => {
  localStorage.clear();
});

describe('RequireAuth', () => {
  it('shows the page to a signed-in user', () => {
    renderAt(true);
    expect(screen.getByText('private page')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign in, remembering where they were going', () => {
    renderAt(false);
    expect(screen.queryByText('private page')).not.toBeInTheDocument();
    expect(screen.getByText('sign-in, from /private')).toBeInTheDocument();
  });
});
