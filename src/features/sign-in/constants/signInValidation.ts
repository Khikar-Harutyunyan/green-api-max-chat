import type { RegisterOptions } from 'react-hook-form';

import { isDigits, isFilled, isHttpUrl } from '@app/utils';
import type { SignInFormValues } from '@features/sign-in/hooks/useSignInForm';

export const SIGN_IN_MESSAGES = {
  apiUrlRequired: 'Введите apiUrl',
  idInstanceRequired: 'Введите idInstance',
  tokenRequired: 'Введите apiTokenInstance',
  idInstanceDigits: 'idInstance состоит только из цифр',
  apiUrlFormat: 'apiUrl — адрес вида https://2300.api.green-api.com',
} as const;

export const SIGN_IN_RULES = {
  apiUrl: {
    validate: {
      filled: (value) => isFilled(value) || SIGN_IN_MESSAGES.apiUrlRequired,
      format: (value) => isHttpUrl(value) || SIGN_IN_MESSAGES.apiUrlFormat,
    },
  },
  apiTokenInstance: {
    validate: (value) => isFilled(value) || SIGN_IN_MESSAGES.tokenRequired,
  },
  idInstance: {
    validate: {
      filled: (value) => isFilled(value) || SIGN_IN_MESSAGES.idInstanceRequired,
      digits: (value) => isDigits(value) || SIGN_IN_MESSAGES.idInstanceDigits,
    },
  },
} satisfies { [Field in keyof SignInFormValues]: RegisterOptions<SignInFormValues, Field> };
