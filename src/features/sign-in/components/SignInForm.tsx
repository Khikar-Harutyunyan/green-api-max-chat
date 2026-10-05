import { useId } from 'react';

import type { FC } from 'react';

import { useSignInForm } from '@features/sign-in/hooks/useSignInForm';

import { Input } from '@ui-kit/Input';
import { Button } from '@ui-kit/Button';

import styles from './styles/SignInForm.module.css';

export const SignInForm: FC = () => {
  const tokenErrorId = useId();
  const apiUrlErrorId = useId();
  const idInstanceErrorId = useId();
  const {
    onSubmit,
    canSubmit,
    submitError,
    isSubmitting,
    errors: {
      apiUrl: apiUrlError,
      idInstance: idInstanceError,
      apiTokenInstance: apiTokenInstanceError,
    },
    fields: { apiUrl, idInstance, apiTokenInstance },
  } = useSignInForm();

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h1 className={styles.title}>MAX</h1>
      <p className={styles.subtitle}>Вход через GREEN-API</p>

      <label className={styles.field}>
        <span className={styles.label}>idInstance</span>
        <Input
          {...idInstance}
          autoFocus
          autoComplete="off"
          inputMode="numeric"
          placeholder="230022752567"
          aria-invalid={Boolean(idInstanceError)}
          aria-describedby={idInstanceError ? idInstanceErrorId : undefined}
        />
        {idInstanceError && (
          <span id={idInstanceErrorId} className={styles.fieldError}>
            {idInstanceError?.message}
          </span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>apiTokenInstance</span>
        <Input
          {...apiTokenInstance}
          type="password"
          autoComplete="off"
          placeholder="Токен из личного кабинета"
          aria-invalid={Boolean(apiTokenInstanceError)}
          aria-describedby={apiTokenInstanceError ? tokenErrorId : undefined}
        />
        {apiTokenInstanceError && (
          <span id={tokenErrorId} className={styles.fieldError}>
            {apiTokenInstanceError?.message}
          </span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          apiUrl <span className={styles.hint}>подставляется по idInstance, можно изменить</span>
        </span>
        <Input
          {...apiUrl}
          autoComplete="off"
          aria-invalid={Boolean(apiUrlError)}
          placeholder="https://2300.api.green-api.com"
          aria-describedby={apiUrlError ? apiUrlErrorId : undefined}
        />
        {apiUrlError && (
          <span id={apiUrlErrorId} className={styles.fieldError}>
            {apiUrlError.message}
          </span>
        )}
      </label>

      {submitError && <p className={styles.error}>{submitError}</p>}

      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? 'Проверяем…' : 'Войти'}
      </Button>

      <p className={styles.note}>
        Данные хранятся только в этом браузере и не отправляются никуда, кроме GREEN-API.
      </p>
    </form>
  );
};
