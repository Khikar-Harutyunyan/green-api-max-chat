import { missingWebhookSettings } from '../missingWebhookSettings';

import type { SettingsResponse } from '@app/api/types';

const settings = (overrides: Partial<SettingsResponse>): SettingsResponse => ({
  wid: 'x@c.us',
  webhookUrl: '',
  webhookUrlToken: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
  incomingMessageStatusWebhook: 'no',
  stateWebhook: 'yes',
  ...overrides,
});

describe('missingWebhookSettings', () => {
  it('is empty when every required webhook is on', () => {
    expect(missingWebhookSettings(settings({}))).toEqual([]);
  });

  it('lists the required webhooks that are off', () => {
    expect(missingWebhookSettings(settings({ incomingWebhook: 'no' }))).toEqual(['incomingWebhook']);
  });

  it('requires the webhook for messages sent from the phone', () => {
    expect(missingWebhookSettings(settings({ outgoingMessageWebhook: 'no' }))).toEqual(['outgoingMessageWebhook']);
  });
});
