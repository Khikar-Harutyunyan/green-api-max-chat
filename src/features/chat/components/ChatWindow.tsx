import { memo, useRef, useEffect, useCallback } from 'react';

import { useGetChatHistoryQuery } from '@app/api/apiService';

import { skipToken } from '@reduxjs/toolkit/query';
import { useAppDispatch, useAppSelector } from '@app/hooks/redux';
import { sendText, selectChatMessages } from '@features/chat/reducers/messages';
import { onCloseChat, onClearAvatar, selectActiveChat } from '@features/chat/reducers/chats';

import { Avatar } from '@ui-kit/Avatar';
import { Button } from '@ui-kit/Button';
import { Composer } from '@features/chat/components/Composer';
import { MessageBubble } from '@features/chat/components/MessageBubble';

import { classNames } from '@app/utils';
import styles from './styles/ChatWindow.module.css';

export const ChatWindow = memo(() => {
  const dispatch = useAppDispatch();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const chat = useAppSelector(selectActiveChat);
  const chatId = chat?.chatId ?? null;
  const history = useAppSelector((state) => selectChatMessages(state, chatId));
  const { isFetching: isHistoryLoading } = useGetChatHistoryQuery(chatId ?? skipToken);

  const onAvatarError = useCallback(() => {
    if (chatId) dispatch(onClearAvatar(chatId));
  }, [chatId, dispatch]);

  const onSend = useCallback(
    (text: string) => {
      if (chatId) void dispatch(sendText({ chatId, text }));
    },
    [chatId, dispatch],
  );

  const onCloseClick = useCallback(() => dispatch(onCloseChat()), [dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [history.length, chatId]);

  if (!chat) {
    return (
      <section className={classNames(styles.chat, styles.empty)}>
        <p className={styles.placeholder}>Выберите чат или создайте новый по номеру телефона</p>
      </section>
    );
  }

  return (
    <section className={styles.chat}>
      <header className={styles.header}>
        <Button
          variant="ghost"
          onClick={onCloseClick}
          className={styles.back}
          aria-label="Назад к чатам"
        >
          ←
        </Button>
        <Avatar name={chat.name} url={chat.avatarUrl} size="small" onError={onAvatarError} />
        <span className={styles.name}>{chat.name}</span>
        <span className={styles.id}>chatId {chat.chatId}</span>
      </header>

      <div className={styles.history} role="log" aria-label="История сообщений">
        {history.length === 0 && (
          <p className={styles.placeholder}>
            {isHistoryLoading
              ? 'Загружаем историю…'
              : 'Сообщений пока нет. Напишите первым.'}
          </p>
        )}
        {history.map((message) => (
          <MessageBubble
            key={message.localId}
            text={message.text}
            status={message.status}
            direction={message.direction}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={onSend} />
    </section>
  );
});

ChatWindow.displayName = 'ChatWindow';
