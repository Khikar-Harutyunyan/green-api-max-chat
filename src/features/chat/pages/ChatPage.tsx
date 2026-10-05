import type { FC } from 'react';

import { selectIsChatOpen } from '@features/chat/reducers/chats';

import { useAppSelector } from '@app/hooks/redux';
import { useAvatars } from '@features/chat/hooks/useAvatars';
import { usePersistence } from '@features/chat/hooks/usePersistence';
import { useNotificationFeed } from '@features/chat/hooks/useNotificationFeed';

import { Banners } from '@features/chat/components/Banners';
import { Sidebar } from '@features/chat/components/Sidebar';
import { ChatWindow } from '@features/chat/components/ChatWindow';

import { classNames } from '@app/utils';
import styles from './styles/ChatPage.module.css';

export const ChatPage: FC = () => {
  usePersistence();
  useAvatars();
  const { online, lastError } = useNotificationFeed();
  const isChatOpen = useAppSelector(selectIsChatOpen);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={classNames(styles.main, !isChatOpen && styles.hiddenOnMobile)}>
        <Banners online={online} lastError={lastError} />
        <ChatWindow />
      </main>
    </div>
  );
};
