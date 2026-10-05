import { render, screen } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { ChatListItem } from '../ChatListItem';

import type { IChatListItem } from '../ChatListItem';

const renderItem = (props: Partial<IChatListItem> = {}) =>
  render(
    <ul>
      <ChatListItem chatId="111" name="Arpi Meliqsetyan" onSelect={jest.fn()} {...props} />
    </ul>,
  );

describe('ChatListItem', () => {
  it('shows the contact name and initials', () => {
    renderItem();
    expect(screen.getByText('Arpi Meliqsetyan')).toBeInTheDocument();
    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('previews the last message', () => {
    renderItem({ lastMessageText: 'до встречи', lastMessageDirection: 'out' });
    expect(screen.getByText('Вы: до встречи')).toBeInTheDocument();
  });

  it('says when there are no messages yet', () => {
    renderItem();
    expect(screen.getByText('Нет сообщений')).toBeInTheDocument();
  });

  it('selects the chat on click', async () => {
    const onSelect = jest.fn();
    renderItem({ onSelect });
    await userEvent.click(screen.getByRole('button', { name: /Arpi Meliqsetyan/ }));
    expect(onSelect).toHaveBeenCalledWith('111');
  });
});
