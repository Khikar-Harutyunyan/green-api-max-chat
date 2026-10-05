import { toDigits } from '@app/utils';

/**
 * Best-effort guess at the console host from the first four digits of the
 * idInstance (230022752991 → https://2300.api.green-api.com).
 *
 * Only a prefill: the rule does not always hold, so the login form keeps the
 * field editable rather than hardcoding this.
 */
export const deriveApiUrl = (idInstance: string): string => {
  const prefix = toDigits(idInstance).slice(0, 4);
  return prefix.length === 4 ? `https://${prefix}.api.green-api.com` : '';
};
