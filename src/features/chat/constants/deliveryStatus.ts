import type { DeliveryStatus } from '@app/types';

export const STATUS_RANK: Record<DeliveryStatus, number> = {
  sent: 1,
  read: 3,
  failed: 0,
  pending: 0,
  delivered: 2,
};

export const STATUS_LABEL: Record<DeliveryStatus, string> = {
  read: 'Прочитано',
  sent: 'Отправлено',
  pending: 'Отправляется',
  delivered: 'Доставлено',
  failed: 'Не отправлено',
};

export const STATUS_GLYPH: Record<DeliveryStatus, string> = {
  sent: '✓',
  read: '✓✓',
  failed: '!',
  pending: '◌',
  delivered: '✓✓',
};
