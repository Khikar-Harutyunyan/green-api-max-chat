import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';

import { onLogin, selectCredentials } from '@features/sign-in';
import { createAppAsyncThunk } from '@app/store/createAppAsyncThunk';

import type { Chat } from '@app/types';
import type { RootState } from '@app/store';
import type { ChatId } from '@app/api/types';
import { apiService } from '@app/api/apiService';
import { toDigits, describeError } from '@app/utils';
import { mergeChats } from '@features/chat/utils/mergeChats';
import { formatPhone } from '@features/chat/utils/formatPhone';

export interface IChats {
  chats: Chat[];
  isChatOpen: boolean;
  activeChatId: ChatId | null;
}

const initialState: IChats = {
  chats: [],
  isChatOpen: false,
  activeChatId: null,
};

export const createChat = createAppAsyncThunk(
  'chats/create',
  async (phoneNumber: string, { dispatch, getState, rejectWithValue }) => {
    const credentials = selectCredentials(getState());
    if (!credentials) return rejectWithValue('Нет учётных данных');

    const digits = toDigits(phoneNumber);
    if (digits.length < 10) {
      return rejectWithValue('Введите номер в международном формате, например 79001234567');
    }

    const known = getState().chats.chats.find((chat) => chat.phoneNumber === digits);
    if (known) return { chatId: known.chatId, phoneNumber: digits };

    try {
      const account = await dispatch(
        apiService.endpoints.checkAccount.initiate(digits, { subscribe: false }),
      ).unwrap();
      if (!account.exist || !account.chatId) {
        return rejectWithValue('Этот номер не зарегистрирован в MAX');
      }
      return { chatId: account.chatId, phoneNumber: digits };
    } catch (error) {
      // Already logged by the API service.
      return rejectWithValue(describeError(error));
    }
  },
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    onSelectChat(state, { payload }: PayloadAction<ChatId>) {
      state.activeChatId = payload;
      state.isChatOpen = true;
    },
    onCloseChat(state) {
      state.isChatOpen = false;
    },
    onSetAvatars: {
      reducer(state, { payload }: PayloadAction<{ urls: Record<ChatId, string | null>; checkedAt: number }>) {
        const { urls, checkedAt } = payload;
        for (const chat of state.chats) {
          if (Object.hasOwn(urls, chat.chatId)) {
            chat.avatarUrl = urls[chat.chatId] ?? null;
            chat.avatarCheckedAt = checkedAt;
          }
        }
      },
      prepare: (urls: Record<ChatId, string | null>) => ({
        payload: { urls, checkedAt: Date.now() },
      }),
    },
    onClearAvatar(state, { payload }: PayloadAction<ChatId>) {
      const chat = state.chats.find((candidate) => candidate.chatId === payload);
      if (!chat) return;
      chat.avatarUrl = undefined;
      chat.avatarCheckedAt = undefined;
    },
    onAddChat(state, { payload }: PayloadAction<{ chatId: ChatId; name: string }>) {
      if (state.chats.some((chat) => chat.chatId === payload.chatId)) return;
      state.chats.push({ chatId: payload.chatId, phoneNumber: '', name: payload.name });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(onLogin, (state, { payload }) => {
        state.chats = payload.chats;
        state.activeChatId = payload.activeChatId;
      })
      .addCase(createChat.fulfilled, (state, { payload }) => {
        const { chatId, phoneNumber } = payload;
        if (!state.chats.some((chat) => chat.chatId === chatId)) {
          state.chats.push({ chatId, phoneNumber, name: formatPhone(phoneNumber) });
        }
        state.activeChatId = chatId;
        state.isChatOpen = true;
      })
      .addMatcher(apiService.endpoints.getChats.matchFulfilled, (state, { payload }) => {
        state.chats = mergeChats(state.chats, payload);
        state.activeChatId ??= payload[0]?.chatId ?? null;
      });
  },
});

const { actions, reducer } = chatsSlice;

export const {
  onAddChat,
  onCloseChat,
  onSelectChat,
  onSetAvatars,
  onClearAvatar,
} = actions;

export const selectChats = (state: RootState) => state.chats.chats;
export const selectActiveChatId = (state: RootState) => state.chats.activeChatId;
export const selectActiveChat = (state: RootState) =>
  state.chats.chats.find((chat) => chat.chatId === state.chats.activeChatId) ?? null;
export const selectIsChatOpen = (state: RootState) => state.chats.isChatOpen;

export default reducer;
