import { memo, useCallback } from 'react';

import { Avatar } from '@ui-kit/Avatar';

import { classNames } from '@app/utils';
import type { Chat, Message } from '@app/types';
import styles from './styles/ChatListItem.module.css';
import { getChatPreview } from '@features/chat/utils/getChatPreview';

export interface IChatListItem extends Pick<Chat, 'name' | 'chatId' | 'avatarUrl'> {
  isActive?: boolean;
  lastMessageText?: string;
  lastMessageDirection?: Message['direction'];
  onSelect: (chatId: Chat['chatId']) => void;
  onAvatarError?: (chatId: Chat['chatId']) => void;
}

export const ChatListItem = memo<IChatListItem>(
  ({
    name,
    chatId,
    onSelect,
    avatarUrl,
    onAvatarError,
    lastMessageText,
    isActive = false,
    lastMessageDirection,
  }) => {
    const handleAvatarError = useCallback(() => onAvatarError?.(chatId), [chatId, onAvatarError]);

    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(chatId)}
          className={classNames(styles.item, isActive && styles.active)}
        >
          <Avatar name={name} url={avatarUrl} onError={handleAvatarError} />
          <span className={styles.text}>
            <span className={styles.name}>{name}</span>
            <span className={styles.preview}>{getChatPreview(lastMessageText, lastMessageDirection)}</span>
          </span>
        </button>
      </li>
    );
  },
);

ChatListItem.displayName = 'ChatListItem';
