import { pickActiveChat } from '@app/utils';

import type { Chat } from '@app/types';

const chats: Chat[] = [
  { chatId: '111', phoneNumber: '', name: 'Первый' },
  { chatId: '222', phoneNumber: '', name: 'Второй' },
];

describe('pickActiveChat', () => {
  it('reopens the remembered chat', () => {
    expect(pickActiveChat(chats, '222')).toBe('222');
  });

  it('falls back to the first chat when the remembered one is gone', () => {
    expect(pickActiveChat(chats, '999')).toBe('111');
  });

  it('returns null when there are no chats', () => {
    expect(pickActiveChat([], null)).toBeNull();
  });
});
