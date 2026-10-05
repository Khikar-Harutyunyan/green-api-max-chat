import { memo } from 'react';

import type { ButtonHTMLAttributes } from 'react';

import { classNames } from '@app/utils';
import styles from './styles/Button.module.css';

export interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  block?: boolean;
  variant?: 'primary' | 'ghost' | 'small';
}

export const Button = memo<IButton>(({
  className,
  block = false,
  type = 'button',
  variant = 'primary',
  ...props
}) => (
  <button
    {...props}
    type={type}
    className={classNames(styles.button, styles[variant], block && styles.block, className)}
  />
));

Button.displayName = 'Button';
