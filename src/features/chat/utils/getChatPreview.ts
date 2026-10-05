import type { Message } from '@app/types';

export const getChatPreview = (text?: string, direction?: Message['direction']): string =>
  text === undefined ? 'Нет сообщений' : `${direction === 'out' ? 'Вы: ' : ''}${text}`;
