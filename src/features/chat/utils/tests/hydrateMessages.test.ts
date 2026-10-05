import { hydrateMessages } from '../hydrateMessages';

import type { Message } from '@app/types';

const message = (overrides: Partial<Message>): Message => ({
  localId: 'L1',
  idMessage: 'm1',
  chatId: '1',
  direction: 'out',
  text: 'hi',
  timestamp: 1,
  status: 'sent',
  ...overrides,
});

describe('hydrateMessages', () => {
  it('rebuilds the dedup set from stored ids', () => {
    const state = hydrateMessages({ '1': [message({}), message({ localId: 'L2', idMessage: null })] });
    expect(state.seen).toEqual({ m1: true });
    expect(state.byChat['1']).toHaveLength(2);
  });

  it('turns a message left pending into a failed one', () => {
    const state = hydrateMessages({ '1': [message({ idMessage: null, status: 'pending' })] });
    expect(state.byChat['1'][0].status).toBe('failed');
  });
});
