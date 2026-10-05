import { memo } from 'react';

import { DeliveryTicks } from '@features/chat/components/DeliveryTicks';

import { classNames } from '@app/utils';
import type { Message } from '@app/types';
import styles from './styles/MessageBubble.module.css';
import { formatTime } from '@features/chat/utils/formatTime';

export interface IMessageBubble extends Pick<Message, 'text' | 'status' | 'direction' | 'timestamp'> { }

export const MessageBubble = memo<IMessageBubble>(({ text, status, direction, timestamp }) => {
  const outgoing = direction === 'out';
  return (
    <div className={classNames(styles.row, outgoing && styles.rowOut)}>
      <div className={classNames(styles.bubble, outgoing ? styles.out : styles.in)}>
        <span className={styles.text}>{text}</span>
        <span className={styles.meta}>
          <span>{formatTime(timestamp)}</span>
          {outgoing && <DeliveryTicks status={status} />}
        </span>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
