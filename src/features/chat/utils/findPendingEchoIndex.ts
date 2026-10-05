import type { Message } from '@app/types';

export const findPendingEchoIndex = (messages: Message[], text: string): number => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const candidate = messages[i];
    if (
      candidate.direction === 'out' &&
      candidate.idMessage === null &&
      candidate.status === 'pending' &&
      candidate.text === text
    ) {
      return i;
    }
  }
  return -1;
};
