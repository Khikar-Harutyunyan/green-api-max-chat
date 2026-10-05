import type { FC } from 'react';

import { SignInForm } from '@features/sign-in/components/SignInForm';

import styles from './styles/SignInPage.module.css';

export const SignInPage: FC = () => (
  <div className={styles.page}>
    <SignInForm />
  </div>
);
