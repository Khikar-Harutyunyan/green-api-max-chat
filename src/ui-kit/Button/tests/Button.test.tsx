import { render, screen } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { Button } from '../Button';

describe('Button', () => {
  it('renders its label as a button', () => {
    render(<Button>Войти</Button>);
    expect(screen.getByRole('button', { name: 'Войти' })).toHaveAttribute('type', 'button');
  });

  it('can be a submit button', () => {
    render(<Button type="submit">Войти</Button>);
    expect(screen.getByRole('button', { name: 'Войти' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when pressed', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Выйти</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Создать
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
