import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { screen, signedInState, renderWithProviders } from '@app/test-utils';

import { GuestOnly } from '../GuestOnly';

import { PATHS } from '@app/router/constants/paths';

const renderAt = (signedIn: boolean, from?: string) => {
  const state = from ? { from: { pathname: from } } : null;
  return renderWithProviders(
    <MemoryRouter initialEntries={[{ pathname: PATHS.signIn, state }]}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path={PATHS.signIn} element={<p>sign-in page</p>} />
        </Route>
        <Route path={PATHS.chats} element={<p>chats page</p>} />
        <Route path="/private" element={<p>private page</p>} />
      </Routes>
    </MemoryRouter>,
    { preloadedState: signedIn ? signedInState() : undefined },
  );
};

beforeEach(() => {
  localStorage.clear();
});

describe('GuestOnly', () => {
  it('shows the page to a signed-out visitor', () => {
    renderAt(false);
    expect(screen.getByText('sign-in page')).toBeInTheDocument();
  });

  it('sends a signed-in user to the chats', () => {
    renderAt(true);
    expect(screen.getByText('chats page')).toBeInTheDocument();
  });

  it('sends a signed-in user on to the page they originally asked for', () => {
    renderAt(true, '/private');
    expect(screen.getByText('private page')).toBeInTheDocument();
  });
});
