import type { DeliveryStatus } from '@app/types';
import type { OutgoingStatus } from '@app/api/types';
import { STATUS_RANK, STATUS_GLYPH, STATUS_LABEL } from '@features/chat/constants/deliveryStatus';

export const mapOutgoingStatus = (status: OutgoingStatus): DeliveryStatus => {
  switch (status) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    default:
      return 'failed';
  }
};

export const shouldApplyStatus = (current: DeliveryStatus, next: DeliveryStatus): boolean =>
  next === 'failed' || STATUS_RANK[next] > STATUS_RANK[current];

export const getDeliveryStatusLabel = (status: DeliveryStatus): string => STATUS_LABEL[status];

export const getDeliveryStatusGlyph = (status: DeliveryStatus): string => STATUS_GLYPH[status];
