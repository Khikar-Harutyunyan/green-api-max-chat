import { memo } from 'react';

import type { ComponentPropsWithRef } from 'react';

import { classNames } from '@app/utils';
import styles from './styles/Input.module.css';

export interface IInput extends ComponentPropsWithRef<'input'> {}

export const Input = memo<IInput>(({ className, ...props }) => (
  <input {...props} className={classNames(styles.input, className)} />
));

Input.displayName = 'Input';
