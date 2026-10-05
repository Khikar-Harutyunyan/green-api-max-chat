import { describeError } from '@app/utils';
import { GreenApiError } from '@app/api/GreenApiError';

export const describeSignInError = (error: unknown): string => {
  if (GreenApiError.from(error)?.isUnreachable && navigator.onLine) {
    return 'Не удалось подключиться по apiUrl — проверьте apiUrl и idInstance';
  }
  return describeError(error);
};
