import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { ChangeEvent, BaseSyntheticEvent } from 'react';
import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';

import { signIn } from '@features/sign-in/reducers/auth';

import { useAppDispatch } from '@app/hooks/redux';

import { deriveApiUrl } from '@features/sign-in/utils/deriveApiUrl';
import { isFilled, describeError, trimTrailingSlashes } from '@app/utils';
import { SIGN_IN_RULES } from '@features/sign-in/constants/signInValidation';

export interface SignInFormValues {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

type SignInField = keyof SignInFormValues;

export interface SignInForm {
  canSubmit: boolean;
  submitError?: string;
  isSubmitting: boolean;
  errors: FieldErrors<SignInFormValues>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  fields: { [Field in SignInField]: UseFormRegisterReturn<Field> };
}

const DEFAULT_VALUES: SignInFormValues = { apiUrl: '', idInstance: '', apiTokenInstance: '' };

export const useSignInForm = (): SignInForm => {
  const dispatch = useAppDispatch();
  const [submitError, setSubmitError] = useState<string>();
  const [apiUrlEdited, setApiUrlEdited] = useState(false);

  const { control, register, setValue, formState, clearErrors, handleSubmit } =
    useForm<SignInFormValues>({ mode: 'onChange', defaultValues: DEFAULT_VALUES });

  const apiUrl = useWatch({ control, name: 'apiUrl' });

  const fields = useMemo<SignInForm['fields']>(
    () => ({
      apiTokenInstance: register('apiTokenInstance', SIGN_IN_RULES.apiTokenInstance),
      idInstance: register('idInstance', {
        ...SIGN_IN_RULES.idInstance,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          if (apiUrlEdited) return;
          const derived = deriveApiUrl(event.target.value);
          setValue('apiUrl', derived, { shouldValidate: derived !== '' });
          if (!derived) clearErrors('apiUrl');
        },
      }),
      apiUrl: register('apiUrl', {
        ...SIGN_IN_RULES.apiUrl,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          setApiUrlEdited(event.target.value !== '');
        },
      }),
    }),
    [apiUrlEdited, register, setValue, clearErrors],
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(undefined);
    const result = await dispatch(
      signIn({
        idInstance: values.idInstance.trim(),
        apiUrl: trimTrailingSlashes(values.apiUrl.trim()),
        apiTokenInstance: values.apiTokenInstance.trim(),
      }),
    );
    if (signIn.rejected.match(result)) {
      setSubmitError(result.payload ?? describeError(result.error));
    }
  });

  return {
    fields,
    onSubmit,
    submitError,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    // An autofilled apiUrl skips validation while it is still empty, so isValid
    // alone could let an empty one through.
    canSubmit: formState.isValid && isFilled(apiUrl),
  };
};
