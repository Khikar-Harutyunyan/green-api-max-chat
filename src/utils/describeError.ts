import { GreenApiError } from '@app/api/GreenApiError';

const describeQuota = ({ quota }: GreenApiError): string => {
  if (!quota) return 'Исчерпан месячный лимит тарифа GREEN-API';
  return `Исчерпан месячный лимит метода ${quota.method} (${quota.used} из ${quota.total})`;
};

/** Turns any thrown value into something worth showing a user, in Russian. */
export const describeError = (thrown: unknown): string => {
  // Also accepts the serialized form that RTK Query stores and `unwrap()` throws.
  const error = GreenApiError.from(thrown);
  if (error) {
    if (error.isUnreachable) {
      return navigator.onLine ? 'GREEN-API не отвечает' : 'Нет подключения к интернету';
    }
    if (error.isUnauthorized) return 'Неверные idInstance или apiTokenInstance';
    if (error.isForbidden) return 'Инстанс не найден по этому apiUrl — проверьте apiUrl и idInstance';
    if (error.isChatLimitReached) {
      return 'Достигнут лимит в 3 чата на тарифе Developer. Удалите чат в личном кабинете GREEN-API.';
    }
    if (error.isQuotaExceeded) return describeQuota(error);
    if (error.isThrottled) return 'Слишком много запросов к GREEN-API, попробуйте через секунду';
    if (error.isRateLimited) {
      return 'Слишком много проверок номеров. GREEN-API приостановил их примерно на 2 часа.';
    }
    return `Ошибка GREEN-API (HTTP ${error.status})`;
  }
  if (thrown instanceof Error && thrown.message) return thrown.message;
  return 'Неизвестная ошибка';
};
