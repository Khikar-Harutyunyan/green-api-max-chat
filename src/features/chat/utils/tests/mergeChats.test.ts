import { mergeChats } from '../mergeChats';

import type { Chat } from '@app/types';

describe('mergeChats', () => {
  it('keeps local chats and adds remote ones', () => {
    const local: Chat[] = [{ chatId: '1', phoneNumber: '79001234567', name: '+79001234567' }];
    const merged = mergeChats(local, [{ chatId: '2', name: 'MAX', type: 'bot', phoneNumber: 0 }]);
    expect(merged.map((chat) => chat.chatId)).toEqual(['1', '2']);
  });

  it('prefers the remote name but keeps the local phone number and avatar', () => {
    const local: Chat[] = [
      { chatId: '1', phoneNumber: '79001234567', name: '+79001234567', avatarUrl: 'u' },
    ];
    const [chat] = mergeChats(local, [{ chatId: '1', name: 'Arpi', type: 'user', phoneNumber: 0 }]);
    expect(chat).toEqual({ chatId: '1', phoneNumber: '79001234567', name: 'Arpi', avatarUrl: 'u' });
  });

  it('falls back to the phone number, then the chatId, for a nameless chat', () => {
    expect(
      mergeChats([], [{ chatId: '1', name: '', type: 'user', phoneNumber: 79001234567 }])[0].name,
    ).toBe('+79001234567');
    expect(mergeChats([], [{ chatId: '2', name: '', type: 'user', phoneNumber: 0 }])[0].name).toBe(
      '2',
    );
  });
});
