import type { StateInstanceResponse } from '@app/api/types';
import { INSTANCE_STATE_MESSAGES } from '@features/sign-in/constants/instanceStateMessages';

export const describeInstanceState = (state: StateInstanceResponse['stateInstance']): string =>
  INSTANCE_STATE_MESSAGES[state] ?? `Состояние инстанса: ${state}`;
