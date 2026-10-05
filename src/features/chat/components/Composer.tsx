import { memo, useState, useCallback } from 'react';

import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react';

import { Button } from '@ui-kit/Button';

import styles from './styles/Composer.module.css';

export interface IComposer {
  onSend: (text: string) => void;
}

export const Composer = memo<IComposer>(({ onSend }) => {
  const [draft, setDraft] = useState('');

  const onSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = draft.trim();
      if (!text) return;
      setDraft('');
      onSend(text);
    },
    [draft, onSend],
  );

  const onDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value);

  const onDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <textarea
        rows={1}
        value={draft}
        className={styles.input}
        onChange={onDraftChange}
        onKeyDown={onDraftKeyDown}
        placeholder="Напишите сообщение…"
      />
      <Button type="submit" disabled={draft.trim() === ''}>
        Отправить
      </Button>
    </form>
  );
});

Composer.displayName = 'Composer';
