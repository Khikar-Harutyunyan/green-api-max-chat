import { findPendingEchoIndex } from '../findPendingEchoIndex';

import type { Message } from '@app/types';

const pending = (localId: string, text: string): Message => ({
  localId,
  idMessage: null,
  chatId: '1',
  direction: 'out',
  text,
  timestamp: 1,
  status: 'pending',
});

describe('findPendingEchoIndex', () => {
  it('finds the newest pending bubble with the same text', () => {
    const messages = [pending('a', 'hi'), pending('b', 'other'), pending('c', 'hi')];
    expect(findPendingEchoIndex(messages, 'hi')).toBe(2);
  });

  it('ignores bubbles that already have an id', () => {
    const messages = [{ ...pending('a', 'hi'), idMessage: 'm1', status: 'sent' as const }];
    expect(findPendingEchoIndex(messages, 'hi')).toBe(-1);
  });

  it('returns -1 when nothing matches', () => {
    expect(findPendingEchoIndex([], 'hi')).toBe(-1);
  });
});
