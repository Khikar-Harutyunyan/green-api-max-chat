import type { FC } from 'react';

import { Tooltip } from '@ui-kit/Tooltip';

import {
  getDeliveryStatusGlyph,
  getDeliveryStatusLabel,
} from '@features/chat/utils/deliveryStatus';
import type { DeliveryStatus } from '@app/types';
import styles from './styles/DeliveryTicks.module.css';

export interface IDeliveryTicks {
  status: DeliveryStatus;
}

export const DeliveryTicks: FC<IDeliveryTicks> = ({ status }) => {
  const label = getDeliveryStatusLabel(status);

  return (
    <Tooltip label={label} align="end">
      <span role="img" aria-label={label} className={styles[status]}>
        {getDeliveryStatusGlyph(status)}
      </span>
    </Tooltip>
  );
};
