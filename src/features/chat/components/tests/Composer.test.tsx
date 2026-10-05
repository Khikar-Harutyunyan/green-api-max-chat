import { render, screen } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { Composer } from '../Composer';

describe('Composer', () => {
  it('sends the trimmed text on Enter and clears the field', async () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} />);
    const field = screen.getByPlaceholderText('Напишите сообщение…');

    await userEvent.type(field, '  привет  {Enter}');

    expect(onSend).toHaveBeenCalledWith('привет');
    expect(field).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter instead of sending', async () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} />);
    const field = screen.getByPlaceholderText('Напишите сообщение…');

    await userEvent.type(field, 'a{Shift>}{Enter}{/Shift}b');

    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue('a\nb');
  });

  it('sends with the button', async () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} />);

    await userEvent.type(screen.getByPlaceholderText('Напишите сообщение…'), 'hi');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('does not send blank text', async () => {
    const onSend = jest.fn();
    render(<Composer onSend={onSend} />);

    await userEvent.type(screen.getByPlaceholderText('Напишите сообщение…'), '   {Enter}');

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });
});
