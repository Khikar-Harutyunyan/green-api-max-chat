import {
  loadChats,
  saveChats,
  loadChatData,
  loadMessages,
  saveMessages,
  loadCredentials,
  saveCredentials,
  clearCredentials,
  loadActiveChatId,
  saveActiveChatId,
  STORED_MESSAGES_PER_CHAT,
} from '../storage';

import { logger } from '../logger';
import type { Message } from '@app/types';

const CREDENTIALS = {
  apiUrl: 'https://3100.api.green-api.com',
  idInstance: '310022752991',
  apiTokenInstance: 'test-token',
};

const message = (index: number): Message => ({
  chatId: '1',
  direction: 'in',
  text: `#${index}`,
  timestamp: index,
  status: 'delivered',
  localId: `m${index}`,
  idMessage: `m${index}`,
});

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips credentials and clears them', () => {
    saveCredentials(CREDENTIALS);
    expect(loadCredentials()).toEqual(CREDENTIALS);

    clearCredentials();
    expect(loadCredentials()).toBeNull();
  });

  it('ignores incomplete stored credentials', () => {
    localStorage.setItem('max-chat.credentials', JSON.stringify({ idInstance: '1' }));
    expect(loadCredentials()).toBeNull();
  });

  it('scopes chats, messages and the active chat per instance', () => {
    saveChats('A', [{ chatId: '1', phoneNumber: '', name: 'One' }]);
    saveMessages('A', { '1': [] });
    saveActiveChatId('A', '1');

    expect(loadChats('A')).toHaveLength(1);
    expect(loadChats('B')).toEqual([]);
    expect(loadMessages('A')).toEqual({ '1': [] });
    expect(loadMessages('B')).toEqual({});
    expect(loadActiveChatId('A')).toBe('1');
    expect(loadActiveChatId('B')).toBeNull();
  });

  it('keeps only the newest messages of each chat', () => {
    const messages = Array.from({ length: STORED_MESSAGES_PER_CHAT + 5 }, (_, index) => message(index));
    saveMessages('A', { '1': messages, '2': messages.slice(0, 2) });

    const stored = loadMessages('A');
    expect(stored['1']).toEqual(messages.slice(5));
    expect(stored['2']).toEqual(messages.slice(0, 2));
  });

  it('forgets the active chat when it is cleared', () => {
    saveActiveChatId('A', '1');
    saveActiveChatId('A', null);
    expect(loadActiveChatId('A')).toBeNull();
  });
});

describe('storage failures', () => {
  // String(), not JSON.stringify: the latter turns an Error into {}.
  const logged = () => jest.mocked(logger.warn).mock.calls.flat().map(String).join('\n');

  afterEach(() => jest.restoreAllMocks());

  it('logs a failed read and starts empty', () => {
    const blocked = new DOMException('blocked', 'SecurityError');
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw blocked;
    });

    expect(loadCredentials()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('Could not read max-chat.credentials', blocked);
  });

  it('ignores corrupt JSON and logs it without the stored text', () => {
    // Unquoted, so the parser quotes the token back in its error message.
    localStorage.setItem('max-chat.credentials', `{"apiTokenInstance":${CREDENTIALS.apiTokenInstance}}`);

    expect(loadCredentials()).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('Ignoring max-chat.credentials: it is not valid JSON');
    expect(logged()).not.toContain(CREDENTIALS.apiTokenInstance);
  });

  it('logs a failed write without the value, and carries on', () => {
    const full = new DOMException('full', 'QuotaExceededError');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw full;
    });

    expect(() => saveCredentials(CREDENTIALS)).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith('Could not save max-chat.credentials', full);
    expect(logged()).not.toContain(CREDENTIALS.apiTokenInstance);
  });

  it('logs a failed removal and carries on', () => {
    const blocked = new DOMException('blocked', 'SecurityError');
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw blocked;
    });

    expect(() => clearCredentials()).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith('Could not remove max-chat.credentials', blocked);
  });
});

describe('loadChatData', () => {
  beforeEach(() => localStorage.clear());

  it('restores chats, messages and the remembered chat', () => {
    saveChats('A', [
      { chatId: '1', phoneNumber: '', name: 'One' },
      { chatId: '2', phoneNumber: '', name: 'Two' },
    ]);
    saveActiveChatId('A', '2');
    saveMessages('A', { '2': [] });

    expect(loadChatData('A')).toEqual({
      chats: [
        { chatId: '1', phoneNumber: '', name: 'One' },
        { chatId: '2', phoneNumber: '', name: 'Two' },
      ],
      activeChatId: '2',
      byChat: { '2': [] },
    });
  });
});
