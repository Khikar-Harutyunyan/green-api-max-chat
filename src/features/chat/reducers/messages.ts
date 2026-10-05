import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';

import { onLogin, selectCredentials } from '@features/sign-in';
import { createAppAsyncThunk } from '@app/store/createAppAsyncThunk';

import type { Message } from '@app/types';
import type { RootState } from '@app/store';
import { apiService } from '@app/api/apiService';
import { nowInSeconds, createLocalId } from '@app/utils';
import { hydrateMessages } from '@features/chat/utils/hydrateMessages';
import { historyItemToMessage } from '@features/chat/utils/historyItemToMessage';
import { findPendingEchoIndex } from '@features/chat/utils/findPendingEchoIndex';
import { notificationToMessage } from '@features/chat/utils/notificationToMessage';
import { mapOutgoingStatus, shouldApplyStatus } from '@features/chat/utils/deliveryStatus';
import type { ChatId, MessageId, StatusNotification, MessageNotification } from '@app/api/types';

export interface IMessages {
  byChat: Record<ChatId, Message[]>;
  seen: Record<MessageId, true>;
}

const initialState: IMessages = {
  byChat: {},
  seen: {},
};

export const sendText = createAppAsyncThunk(
  'messages/sendText',
  async ({ chatId, text }: { chatId: ChatId; text: string }, { dispatch, getState }) => {
    if (!selectCredentials(getState())) return;

    const localId = createLocalId();
    dispatch(onQueueMessage({ localId, chatId, text, timestamp: nowInSeconds() }));

    try {
      const idMessage = await dispatch(
        apiService.endpoints.sendMessage.initiate({ chatId, text }, { track: false }),
      ).unwrap();
      dispatch(onSetMessageSent({ localId, chatId, idMessage }));
    } catch {
      dispatch(onSetMessageFailed({ localId, chatId }));
    }
  },
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    onQueueMessage(state, { payload }: PayloadAction<{ localId: string; chatId: ChatId; text: string; timestamp: number }>) {
      const { localId, chatId, text, timestamp } = payload;
      (state.byChat[chatId] ??= []).push({
        localId,
        idMessage: null,
        chatId,
        direction: 'out',
        text,
        timestamp,
        status: 'pending',
      });
    },

    onSetMessageSent(state, { payload }: PayloadAction<{ localId: string; chatId: ChatId; idMessage: MessageId }>) {
      const { localId, chatId, idMessage } = payload;
      const message = state.byChat[chatId]?.find((m) => m.localId === localId);
      if (!message || message.idMessage !== null) return;

      message.idMessage = idMessage;
      message.status = 'sent';
      state.seen[idMessage] = true;
    },

    onSetMessageFailed(state, { payload }: PayloadAction<{ localId: string; chatId: ChatId }>) {
      const { localId, chatId } = payload;
      const message = state.byChat[chatId]?.find((m) => m.localId === localId);
      if (message) message.status = 'failed';
    },

    onSetMessageStatus(state, { payload }: PayloadAction<StatusNotification>) {
      const message = state.byChat[payload.chatId]?.find((m) => m.idMessage === payload.idMessage);
      const status = mapOutgoingStatus(payload.status);
      if (message && shouldApplyStatus(message.status, status)) message.status = status;
    },

    onReceiveMessage(state, { payload }: PayloadAction<MessageNotification>) {
      const message = notificationToMessage(payload);
      if (!message || message.idMessage === null) return;
      if (state.seen[message.idMessage]) return;

      if (payload.kind === 'outgoingEcho') {
        const existing = state.byChat[payload.chatId] ?? [];
        const index = findPendingEchoIndex(existing, payload.text);
        if (index !== -1) {
          existing[index].idMessage = payload.idMessage;
          existing[index].status = 'sent';
          state.seen[payload.idMessage] = true;
          return;
        }
      }

      (state.byChat[message.chatId] ??= []).push(message);
      state.seen[message.idMessage] = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(onLogin, (_, { payload }) => hydrateMessages(payload.byChat))
      .addMatcher(apiService.endpoints.getChatHistory.matchFulfilled, (state, { payload, meta }) => {
        const chatId = meta.arg.originalArgs;
        const fresh = payload
          .map(historyItemToMessage)
          .filter((message): message is Message => message !== null)
          .filter((message) => message.idMessage !== null && !state.seen[message.idMessage]);
        if (fresh.length === 0) return;

        for (const message of fresh) {
          if (message.idMessage !== null) state.seen[message.idMessage] = true;
        }
        const existing = state.byChat[chatId] ?? [];
        state.byChat[chatId] = [...existing, ...fresh].sort((a, b) => a.timestamp - b.timestamp);
      });
  },
});

const { actions, reducer } = messagesSlice;

export const {
  onQueueMessage,
  onReceiveMessage,
  onSetMessageSent,
  onSetMessageFailed,
  onSetMessageStatus,
} = actions;

const NO_MESSAGES: Message[] = [];

export const selectMessagesByChat = (state: RootState) => state.messages.byChat;
export const selectChatMessages = (state: RootState, chatId: ChatId | null) =>
  (chatId && state.messages.byChat[chatId]) || NO_MESSAGES;

export default reducer;
