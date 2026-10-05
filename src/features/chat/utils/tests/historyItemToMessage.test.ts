import { historyItemToMessage } from '../historyItemToMessage';

import type { ChatHistoryItem } from '@app/api/types';

const BASE: ChatHistoryItem = {
  type: 'incoming',
  idMessage: '117366886462654831',
  timestamp: 1790876563,
  chatId: '462217484',
};

describe('historyItemToMessage', () => {
  it('reads the top-level textMessage of an incoming item', () => {
    expect(historyItemToMessage({ ...BASE, textMessage: 'Hi', senderName: 'Arpi' })).toEqual({
      localId: 'hist:117366886462654831',
      idMessage: '117366886462654831',
      chatId: '462217484',
      direction: 'in',
      text: 'Hi',
      timestamp: 1790876563,
      status: 'read',
      senderName: 'Arpi',
    });
  });

  it('falls back to extendedTextMessage and maps statusMessage on outgoing items', () => {
    const message = historyItemToMessage({
      ...BASE,
      type: 'outgoing',
      extendedTextMessage: { text: 'hello' },
      statusMessage: 'delivered',
    });
    expect(message).toMatchObject({ direction: 'out', text: 'hello', status: 'delivered' });
  });

  it('assumes sent when an outgoing item has no status', () => {
    expect(historyItemToMessage({ ...BASE, type: 'outgoing', textMessage: 'x' })?.status).toBe('sent');
  });

  it('skips non-text items', () => {
    expect(historyItemToMessage({ ...BASE, typeMessage: 'imageMessage' })).toBeNull();
    expect(historyItemToMessage({ ...BASE, textMessage: '' })).toBeNull();
  });
});
