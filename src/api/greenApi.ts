import { logger } from '@app/services/logger';
import { GreenApiError } from './GreenApiError';

import type {
  ChatId,
  ChatSummary,
  Credentials,
  Notification,
  AvatarResponse,
  ChatHistoryItem,
  SettingsResponse,
  ContactInfoResponse,
  SendMessageResponse,
  CheckAccountResponse,
  StateInstanceResponse,
} from './types';
import { toDigits, isAbortError, trimTrailingSlashes } from '@app/utils';

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(credentials: Credentials, method: string, ...extra: string[]): string {
  const base = trimTrailingSlashes(credentials.apiUrl);
  const tail = extra.length ? `/${extra.join('/')}` : '';
  return `${base}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${tail}`;
}

async function request<T>(
  credentials: Credentials,
  httpMethod: 'GET' | 'POST' | 'DELETE',
  apiMethod: string,
  { signal, body }: RequestOptions = {},
  ...extra: string[]
): Promise<T> {
  const url = buildUrl(credentials, apiMethod, ...extra);

  const init: RequestInit = { method: httpMethod, signal };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new GreenApiError(apiMethod, 0, '', 'Нет соединения с GREEN-API');
  }

  const text = await response.text();

  if (!response.ok) {
    throw new GreenApiError(apiMethod, response.status, text);
  }

  return (text ? JSON.parse(text) : null) as T;
}

export function getStateInstance(credentials: Credentials, signal?: AbortSignal) {
  return request<StateInstanceResponse>(credentials, 'GET', 'getStateInstance', { signal });
}

export function getSettings(credentials: Credentials, signal?: AbortSignal) {
  return request<SettingsResponse>(credentials, 'GET', 'getSettings', { signal });
}

export function setSettings(
  credentials: Credentials,
  patch: Record<string, string>,
  signal?: AbortSignal,
) {
  return request<{ saveSettings: boolean }>(credentials, 'POST', 'setSettings', {
    signal,
    body: { webhookUrl: '', ...patch },
  });
}

export function getChats(credentials: Credentials, signal?: AbortSignal) {
  return request<ChatSummary[]>(credentials, 'GET', 'getChats', { signal });
}

export function getAvatar(credentials: Credentials, chatId: ChatId, signal?: AbortSignal) {
  return request<AvatarResponse>(credentials, 'POST', 'getAvatar', { signal, body: { chatId } });
}

export function getContactInfo(credentials: Credentials, chatId: ChatId, signal?: AbortSignal) {
  return request<ContactInfoResponse>(credentials, 'POST', 'getContactInfo', {
    signal,
    body: { chatId },
  });
}

export function getChatHistory(
  credentials: Credentials,
  chatId: ChatId,
  count = 50,
  signal?: AbortSignal,
) {
  return request<ChatHistoryItem[]>(credentials, 'POST', 'getChatHistory', {
    signal,
    body: { chatId, count },
  });
}

export function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
  signal?: AbortSignal,
) {
  return request<CheckAccountResponse>(credentials, 'POST', 'checkAccount', {
    signal,
    body: { phoneNumber: Number(toDigits(phoneNumber)) },
  });
}

export function sendMessage(
  credentials: Credentials,
  chatId: ChatId,
  message: string,
  signal?: AbortSignal,
) {
  return request<SendMessageResponse>(credentials, 'POST', 'sendMessage', {
    signal,
    body: { chatId, message },
  });
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeoutSeconds = 10,
  signal?: AbortSignal,
): Promise<Notification | null> {
  const url = `${buildUrl(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeoutSeconds}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new GreenApiError('receiveNotification', 0, '', 'Нет соединения с GREEN-API');
  }

  if (response.status === 408) return null;

  const text = await response.text();
  if (!response.ok) throw new GreenApiError('receiveNotification', response.status, text);

  if (!text || text === 'null') return null;
  const parsed = JSON.parse(text) as Notification | null;
  return parsed && parsed.receiptId !== undefined ? parsed : null;
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await request<{ result: boolean }>(
      credentials,
      'DELETE',
      'deleteNotification',
      { signal },
      String(receiptId),
    );
  } catch (err) {
    if (isAbortError(err)) throw err;
    logger.warn(`Could not delete notification ${receiptId}`, err);
  }
}
