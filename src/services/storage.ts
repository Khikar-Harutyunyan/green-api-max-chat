import { logger } from './logger';
import { pickActiveChat } from '@app/utils';
import type { Chat, Message } from '@app/types';
import type { ChatId, Credentials } from '@app/api/types';

const PREFIX = 'max-chat';

export const STORED_MESSAGES_PER_CHAT = 50;

function read<T>(key: string): T | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    logger.warn(`Could not read ${key}`, error);
    return null;
  }
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn(`Ignoring ${key}: it is not valid JSON`);
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn(`Could not save ${key}`, error);
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.warn(`Could not remove ${key}`, error);
  }
}

const credentialsKey = `${PREFIX}.credentials`;
const chatsKey = (idInstance: string) => `${PREFIX}.chats.${idInstance}`;
const messagesKey = (idInstance: string) => `${PREFIX}.messages.${idInstance}`;
const activeChatKey = (idInstance: string) => `${PREFIX}.activeChat.${idInstance}`;

export function loadCredentials(): Credentials | null {
  const stored = read<Partial<Credentials>>(credentialsKey);
  if (!stored?.apiUrl || !stored.idInstance || !stored.apiTokenInstance) return null;
  return {
    apiUrl: stored.apiUrl,
    idInstance: stored.idInstance,
    apiTokenInstance: stored.apiTokenInstance,
  };
}

export function saveCredentials(credentials: Credentials): void {
  write(credentialsKey, credentials);
}

export function clearCredentials(): void {
  remove(credentialsKey);
}

export function loadChats(idInstance: string): Chat[] {
  return read<Chat[]>(chatsKey(idInstance)) ?? [];
}

export function saveChats(idInstance: string, chats: Chat[]): void {
  write(chatsKey(idInstance), chats);
}

export function loadActiveChatId(idInstance: string): ChatId | null {
  return read<ChatId>(activeChatKey(idInstance));
}

export function saveActiveChatId(idInstance: string, chatId: ChatId | null): void {
  if (chatId === null) remove(activeChatKey(idInstance));
  else write(activeChatKey(idInstance), chatId);
}

export function loadMessages(idInstance: string): Record<ChatId, Message[]> {
  return read<Record<ChatId, Message[]>>(messagesKey(idInstance)) ?? {};
}

export function saveMessages(idInstance: string, byChat: Record<ChatId, Message[]>): void {
  const newest = Object.entries(byChat).map(([chatId, messages]) => [
    chatId,
    messages.slice(-STORED_MESSAGES_PER_CHAT),
  ]);
  write(messagesKey(idInstance), Object.fromEntries(newest));
}

export interface StoredChatData {
  chats: Chat[];
  activeChatId: ChatId | null;
  byChat: Record<ChatId, Message[]>;
}

export function loadChatData(idInstance: string): StoredChatData {
  const chats = loadChats(idInstance);
  return {
    chats,
    activeChatId: pickActiveChat(chats, loadActiveChatId(idInstance)),
    byChat: loadMessages(idInstance),
  };
}
