import { memo, useCallback } from 'react';

import { useGetChatsQuery } from '@app/api/apiService';

import {
  selectChats,
  onSelectChat,
  onClearAvatar,
  selectIsChatOpen,
  selectActiveChatId,
} from '@features/chat/reducers/chats';
import { signOut, selectCredentials } from '@features/sign-in';
import { useAppDispatch, useAppSelector } from '@app/hooks/redux';
import { selectMessagesByChat } from '@features/chat/reducers/messages';


import { Button } from '@ui-kit/Button';
import { NewChatForm } from '@features/chat/components/NewChatForm';
import { ChatListItem } from '@features/chat/components/ChatListItem';

import { classNames } from '@app/utils';
import type { ChatId } from '@app/api/types';
import styles from './styles/Sidebar.module.css';

export const Sidebar = memo(() => {
  const dispatch = useAppDispatch();

  const chats = useAppSelector(selectChats);
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const activeChatId = useAppSelector(selectActiveChatId);
  const credentials = useAppSelector(selectCredentials);
  const messagesByChat = useAppSelector(selectMessagesByChat);

  useGetChatsQuery();

  const onSignOutClick = useCallback(() => dispatch(signOut()), [dispatch]);
  const handleSelect = useCallback((chatId: ChatId) => dispatch(onSelectChat(chatId)), [dispatch]);
  const handleAvatarError = useCallback((chatId: ChatId) => dispatch(onClearAvatar(chatId)), [dispatch]);

  return (
    <aside className={classNames(styles.sidebar, isChatOpen && styles.hiddenOnMobile)}>
      <header className={styles.header}>
        <div>
          <div className={styles.title}>Чаты</div>
          <div className={styles.instance}>{credentials?.idInstance}</div>
        </div>
        <Button variant="ghost" onClick={onSignOutClick}>
          Выйти
        </Button>
      </header>

      <div className={styles.actions}>
        <NewChatForm />
      </div>

      <ul className={styles.list}>
        {chats.length === 0 && <li className={styles.empty}>Пока нет чатов</li>}

        {chats.map(({ name, chatId, avatarUrl }) => {
          const lastMessage = messagesByChat[chatId]?.at(-1);
          return (
            <ChatListItem
              key={chatId}
              name={name}
              chatId={chatId}
              avatarUrl={avatarUrl}
              onSelect={handleSelect}
              onAvatarError={handleAvatarError}
              isActive={chatId === activeChatId}
              lastMessageText={lastMessage?.text}
              lastMessageDirection={lastMessage?.direction}
            />
          );
        })}
      </ul>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
