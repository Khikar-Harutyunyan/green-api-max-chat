import { memo, useMemo, useCallback } from 'react';

import {
  useGetSettingsQuery,
  useSetSettingsMutation,
  useGetStateInstanceQuery,
} from '@app/api/apiService';

import { Button } from '@ui-kit/Button';

import styles from './styles/Banners.module.css';
import { classNames, describeError } from '@app/utils';
import { REQUIRED_WEBHOOK_SETTINGS } from '@app/api/constants';
import type { NotificationsStatus } from '@features/chat/hooks/useNotifications';
import { missingWebhookSettings } from '@features/chat/utils/missingWebhookSettings';

export interface IBanners extends NotificationsStatus {}

export const Banners = memo<IBanners>(({ online, lastError }) => {
  const { data: settings } = useGetSettingsQuery();
  const { data: instanceState } = useGetStateInstanceQuery();
  const [setSettings, { isLoading: enablingNotifications, error: settingsError }] =
    useSetSettingsMutation();

  const missingSettings = useMemo(() => (settings ? missingWebhookSettings(settings) : []), [settings]);

  const onEnableClick = useCallback(() => {
    void setSettings(REQUIRED_WEBHOOK_SETTINGS);
  }, [setSettings]);

  return (
    <>
      {instanceState && instanceState !== 'authorized' && (
        <div className={classNames(styles.banner, styles.error)}>
          Инстанс не авторизован ({instanceState}). Отправка и получение сообщений не работают.
        </div>
      )}

      {missingSettings.length > 0 && (
        <div className={classNames(styles.banner, styles.warning)}>
          <span>
            На инстансе выключены уведомления ({missingSettings.join(', ')}) — новые сообщения
            не будут появляться в чате.
          </span>
          <Button variant="small" onClick={onEnableClick} disabled={enablingNotifications}>
            {enablingNotifications ? 'Включаем…' : 'Включить'}
          </Button>
          {settingsError && <span className={styles.detail}>{describeError(settingsError)}</span>}
        </div>
      )}

      {!online && (
        <div className={classNames(styles.banner, styles.warning)}>
          Нет связи с GREEN-API, пробуем переподключиться…
          {lastError && <span className={styles.detail}>{describeError(lastError)}</span>}
        </div>
      )}
    </>
  );
});

Banners.displayName = 'Banners';
