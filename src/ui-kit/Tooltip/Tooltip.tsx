import type { FC, ReactNode } from 'react';

import { classNames } from '@app/utils';
import styles from './styles/Tooltip.module.css';

export interface ITooltip {
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}

export const Tooltip: FC<ITooltip> = ({ label, children, align = 'center' }) => (
  <span className={styles.tooltip}>
    {children}
    <span aria-hidden="true" className={classNames(styles.label, styles[align])}>
      {label}
    </span>
  </span>
);
