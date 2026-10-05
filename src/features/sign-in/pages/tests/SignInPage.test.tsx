import { screen, renderWithProviders } from '@app/test-utils';

import { SignInPage } from '../SignInPage';

describe('SignInPage', () => {
  it('shows the sign-in form', () => {
    renderWithProviders(<SignInPage />);
    expect(screen.getByRole('heading', { name: 'MAX' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });
});
