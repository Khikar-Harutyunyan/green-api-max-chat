import type { SettingsResponse } from '@app/api/types';
import { REQUIRED_WEBHOOK_SETTINGS } from '@app/api/constants';

export const missingWebhookSettings = (settings: SettingsResponse): string[] =>
  Object.keys(REQUIRED_WEBHOOK_SETTINGS).filter((key) => settings[key] !== 'yes');
