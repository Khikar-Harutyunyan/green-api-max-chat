import { retry, createApi } from '@reduxjs/toolkit/query/react';

import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';

import {
  getChats,
  getAvatar,
  getSettings,
  setSettings,
  sendMessage,
  checkAccount,
  getChatHistory,
  getContactInfo,
  getStateInstance,
} from './greenApi';
import { logger } from '@app/services/logger';

import { GreenApiError } from './GreenApiError';

import type {
  ChatId,
  MessageId,
  ChatSummary,
  Credentials,
  InstanceState,
  ChatHistoryItem,
  SettingsResponse,
  CheckAccountResponse,
} from './types';
import { sleep } from '@app/utils';
import type { RootState } from '@app/store';
import { HISTORY_PAGE_SIZE } from './constants';
import type { SerializedGreenApiError } from './GreenApiError';

type GreenApiCall = (credentials: Credentials, signal: AbortSignal) => Promise<unknown>;

const greenApiQuery: BaseQueryFn<GreenApiCall, unknown, SerializedGreenApiError> = async (
  call,
  { getState, signal, endpoint },
) => {
  const { credentials } = (getState() as RootState).auth;
  if (!credentials) {
    return { error: new GreenApiError(endpoint, 401, '', 'Нет учётных данных').serialize() };
  }

  try {
    return { data: await call(credentials, signal) };
  } catch (thrown) {
    const error = GreenApiError.from(thrown) ?? new GreenApiError(endpoint, 0, '', String(thrown));
    // An abort is the query being canceled, not a failure worth reporting.
    if (!signal.aborted) logger.warn(`${endpoint} request failed`, error);
    return { error: error.serialize() };
  }
};

const RETRY_DELAY_MS = 1000;

const baseQuery = retry(greenApiQuery, {
  retryCondition: (error, _args, { attempt }) =>
    attempt <= 2 && GreenApiError.from(error)?.isThrottled === true,
  backoff: (attempt, _maxRetries, signal) =>
    sleep(RETRY_DELAY_MS * attempt, signal ?? new AbortController().signal),
});

export const apiService = createApi({
  reducerPath: 'api',
  baseQuery,
  endpoints: (build) => ({
    getStateInstance: build.query<InstanceState, void>({
      query: () => getStateInstance,
      transformResponse: ({ stateInstance }: { stateInstance: InstanceState }) => stateInstance,
    }),

    getSettings: build.query<SettingsResponse, void>({
      query: () => getSettings,
    }),

    setSettings: build.mutation<void, Record<string, string>>({
      query: (patch) => (credentials, signal) => setSettings(credentials, patch, signal),
      async onQueryStarted(patch, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(
          apiService.util.updateQueryData('getSettings', undefined, (settings) => {
            Object.assign(settings, patch);
          }),
        );
      },
    }),

    getChats: build.query<ChatSummary[], void>({
      query: () => getChats,
    }),

    getChatHistory: build.query<ChatHistoryItem[], ChatId>({
      query: (chatId) => (credentials, signal) =>
        getChatHistory(credentials, chatId, HISTORY_PAGE_SIZE, signal),
      keepUnusedDataFor: Infinity,
    }),

    getAvatar: build.query<string, ChatId>({
      query: (chatId) => (credentials, signal) => getAvatar(credentials, chatId, signal),
      transformResponse: ({ urlAvatar }: { urlAvatar: string }) => urlAvatar,
    }),

    getContactInfo: build.query<string, ChatId>({
      query: (chatId) => (credentials, signal) => getContactInfo(credentials, chatId, signal),
      transformResponse: ({ avatar }: { avatar: string }) => avatar,
    }),

    checkAccount: build.query<CheckAccountResponse, string>({
      query: (phoneNumber) => (credentials, signal) => checkAccount(credentials, phoneNumber, signal),
    }),

    sendMessage: build.mutation<MessageId, { chatId: ChatId; text: string }>({
      query: ({ chatId, text }) => (credentials, signal) => sendMessage(credentials, chatId, text, signal),
      transformResponse: ({ idMessage }: { idMessage: MessageId }) => idMessage,
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetSettingsQuery,
  useSetSettingsMutation,
  useGetChatHistoryQuery,
  useGetStateInstanceQuery,
} = apiService;
