import { memo, useState, useCallback } from 'react';

import type { ChangeEvent, SyntheticEvent } from 'react';

import { createChat } from '@features/chat/reducers/chats';

import { useAppDispatch } from '@app/hooks/redux';

import { Input } from '@ui-kit/Input';
import { Button } from '@ui-kit/Button';

import { describeError } from '@app/utils';
import styles from './styles/NewChatForm.module.css';

export const NewChatForm = memo(() => {
  const dispatch = useAppDispatch();

  const [adding, setAdding] = useState(false);
  const [disable, setDisable] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disable) return;

    setDisable(true);
    setError(null);
    const result = await dispatch(createChat(phoneNumber));
    if (createChat.fulfilled.match(result)) {
      setPhoneNumber('');
      setAdding(false);
    } else {
      setError(result.payload ?? describeError(result.error));
    }
    setDisable(false);
  };

  const onNewChatClick = useCallback(() => setAdding(true), []);

  const onCancelClick = useCallback(() => {
    setAdding(false);
    setError(null);
  }, []);

  const onPhoneChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  }, []);

  if (!adding) {
    return (
      <Button block onClick={onNewChatClick}>
        + Новый чат
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Input
        autoFocus
        inputMode="tel"
        value={phoneNumber}
        onChange={onPhoneChange}
        placeholder="79001234567"
      />
      <div className={styles.row}>
        <Button type="submit" disabled={disable}>
          {disable ? 'Проверяем…' : 'Создать'}
        </Button>
        <Button variant="ghost" onClick={onCancelClick}>
          Отмена
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
});

NewChatForm.displayName = 'NewChatForm';
